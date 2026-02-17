'use client';

import { Suspense, useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { BookingBreadcrumb } from "@/components/booking-breadcrumb";
import { BookingSummary } from "@/components/booking-summary";
import { api, Service, Staff } from "@/lib/api/index";

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
  "juillet", "aout", "septembre", "octobre", "novembre", "decembre"
];

const dayNames = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];

function HeurePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const salonId = searchParams.get("salon") || "championnet";
  const serviceParam = searchParams.get("service")?.trim() || "";
  const professionalId = searchParams.get("professional") || "any";

  const salon = salonsData[salonId as keyof typeof salonsData];

  // States pour les données chargées depuis l'API
  const [service, setService] = useState<Service | null>(null);
  const [professional, setProfessional] = useState<Staff | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get current date (memoized to avoid recreating on every render)
  const today = useMemo(() => new Date(), []);
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date | null>(today);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // Calculer la durée totale et le prix total
  const totalPrice = service ? Number(service.price) : 0;

  // Charger la prestation depuis l'API
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
        console.error('Erreur lors du chargement de la prestation:', err);
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement de la prestation');
      } finally {
        setLoading(false);
      }
    }

    fetchService();
  }, [serviceParam]);

  // Charger le professionnel si ce n'est pas "any"
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

  // 1. Charger les créneaux disponibles (Ne dépend PLUS de selectedTime)
  useEffect(() => {
    async function fetchAvailableSlots() {
      // Si pas de date ou de prestation, on vide les slots
      if (!selectedDate || !service) {
        setAvailableSlots([]);
        return;
      }

      try {
        setLoadingSlots(true);
        // Format de date: YYYY-MM-DD (utiliser les composants locaux pour éviter les décalages de timezone)
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;

        // Reservation mono-prestation
        const slots = await api.bookings.getAvailableSlots(
          salonId,
          professionalId,
          service.id,
          dateStr
        );

        setAvailableSlots(slots);
      } catch (err) {
        console.error('Erreur lors du chargement des créneaux:', err);
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    }

    fetchAvailableSlots();
  }, [selectedDate, salonId, professionalId, service]);

  // 2. Vérifier si l'heure sélectionnée est toujours valide
  // Ce petit effet instantané ne fait pas d'appel API
  useEffect(() => {
    // Si on a une heure sélectionnée, qu'on a fini de charger, 
    // et que cette heure n'est pas dans la liste des créneaux : on réinitialise.
    if (!loadingSlots && selectedTime && !availableSlots.includes(selectedTime)) {
      setSelectedTime(null);
    }
  }, [availableSlots, selectedTime, loadingSlots]);
  // Check if we can go to previous month (not before current month)
  const canGoPrevious = () => {
    if (currentYear > today.getFullYear()) return true;
    if (currentYear === today.getFullYear() && currentMonth > today.getMonth()) return true;
    return false;
  };

  // Navigate months
  const goToPreviousMonth = () => {
    if (!canGoPrevious()) return;

    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Generate all days for the current month
  const generateDays = useMemo(() => {
    const days = [];
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // Get the first day of the month to know which day of week it starts on
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

    // Add empty cells for days before the month starts
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }

    // Generate all days of the month
    for (let dayNumber = 1; dayNumber <= daysInMonth; dayNumber++) {
      const date = new Date(currentYear, currentMonth, dayNumber);
      const dayOfWeek = date.getDay();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const isPast = date < todayStart;

      days.push({
        number: dayNumber,
        name: dayNames[dayOfWeek],
        date: date,
        isPast: isPast,
        isToday: date.toDateString() === today.toDateString(),
      });
    }

    return days;
  }, [currentMonth, currentYear, today]);

  const days = generateDays;

  const handleContinue = () => {
    if (selectedTime && selectedDate) {
      // Rediriger vers la page de validation avec tous les paramètres
      // Format: YYYY-MM-DD (utiliser les composants locaux pour éviter les décalages de timezone)
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const params = new URLSearchParams({
        salon: salonId,
        service: serviceParam,
        professional: professionalId,
        date: dateStr,
        time: selectedTime
      });
      router.push(`/reserver/valider?${params.toString()}`);
    }
  };

  const handleDateSelect = (day: { date: Date; isPast: boolean }) => {
    if (!day.isPast) {
      setSelectedDate(day.date);
    }
  };

  // Helper pour formater la durée
  const formatDuration = (minutes: number): string => {
    return `${minutes} min`;
  };

  // Nom du professionnel
  const professionalName = professional
    ? `${professional.firstName} ${professional.lastName}`
    : "n'importe quel professionnel";

  // Afficher l'état de chargement initial
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="font-archivo text-xl text-gray-600">Chargement...</p>
      </div>
    );
  }

  // Afficher l'erreur
  if (error || !service) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="font-archivo text-xl text-red-600 mb-4">
            {error || "Prestation introuvable"}
          </p>
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Back button */}
        <Link
          href={`/reserver/professionnel?salon=${salonId}&service=${serviceParam}`}
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
              href: `/reserver/professionnel?salon=${salonId}&service=${serviceParam}`,
            },
            { label: "Heure", active: true },
            { label: "Valider" },
          ]}
        />

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left: Date & Time */}
          <div className="lg:col-span-2">
            <h1 className="font-archivo font-black text-3xl sm:text-4xl md:text-5xl text-black mb-6 sm:mb-8 uppercase">
              Selectionnez l&apos;heure
            </h1>

            {/* Professional selector */}
            <div className="mb-6 sm:mb-8">
              <select className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-white border border-black font-archivo font-bold text-sm sm:text-base uppercase focus:outline-none focus:border-[#DE2788]">
                <option>{professionalName}</option>
              </select>
            </div>

            {/* Calendar header */}
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="font-archivo font-black text-xl sm:text-2xl text-black uppercase">
                {monthNames[currentMonth]} {currentYear}
              </h2>
              <div className="flex gap-1 sm:gap-2">
                <button
                  onClick={goToPreviousMonth}
                  disabled={!canGoPrevious()}
                  className={`p-2 rounded-full transition-colors cursor-pointer ${canGoPrevious()
                      ? "hover:bg-gray-100"
                      : "opacity-30 cursor-not-allowed"
                    }`}
                >
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
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <button
                  onClick={goToNextMonth}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                >
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
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="mb-6 sm:mb-8">
              {/* Week day headers */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-3 sm:mb-4">
                {["DIM", "LUN", "MAR", "MER", "JEU", "VEN", "SAM"].map((day) => (
                  <div
                    key={day}
                    className="text-center font-archivo font-black text-xs sm:text-sm text-black py-1 sm:py-2"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {days.map((day, index) => (
                  <div key={index}>
                    {day === null ? (
                      <div className="aspect-square"></div>
                    ) : (
                      <button
                        onClick={() => handleDateSelect(day)}
                        className={`aspect-square w-full flex items-center justify-center font-archivo font-black text-sm sm:text-base md:text-lg transition-all cursor-pointer ${selectedDate?.toDateString() === day.date.toDateString()
                            ? "bg-[#DE2788] text-white border border-[#DE2788]"
                            : day.isPast
                              ? "bg-gray-100 text-gray-300 cursor-not-allowed border border-gray-200"
                              : day.isToday
                                ? "bg-black text-white border border-black hover:bg-[#DE2788] hover:border-[#DE2788]"
                                : "bg-white text-black border border-black hover:border-[#DE2788]"
                          }`}
                        disabled={day.isPast}
                      >
                        {day.number}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Time slots */}
            <div className="space-y-3 sm:space-y-4">
              {/* Chargement des créneaux */}
              {loadingSlots && (
                <div className="text-center py-6 sm:py-8">
                  <p className="font-archivo text-base sm:text-lg text-gray-600">Chargement des créneaux...</p>
                </div>
              )}

              {/* Aucun créneau disponible */}
              {!loadingSlots && availableSlots.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-300 p-4 sm:p-6 text-center">
                  <p className="font-archivo text-sm sm:text-base text-yellow-800">
                    Aucun créneau disponible pour cette date.
                  </p>
                  <p className="font-archivo text-xs sm:text-sm text-yellow-700 mt-2">
                    Veuillez sélectionner une autre date.
                  </p>
                </div>
              )}

              {/* Créneaux disponibles */}
              {!loadingSlots && availableSlots.map((time: string) => (
                <button
                  key={time}
                  onClick={() => setSelectedTime(time)}
                  className={`w-full p-4 sm:p-5 text-center font-archivo font-black text-base sm:text-lg uppercase transition-colors cursor-pointer ${selectedTime === time
                      ? "bg-[#DE2788] text-white border border-[#DE2788]"
                      : "bg-white text-black border border-black hover:border-[#DE2788]"
                    }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>

          {/* Right: Summary */}
          <div className="lg:col-span-1">
            <BookingSummary
              salon={salon}
              service={service ? {
                name: service.name,
                duration: formatDuration(service.duration),
                price: Number(service.price),
              } : undefined}
              professional={{ name: professionalName }}
              date={
                selectedDate
                  ? `${selectedDate.getDate()} ${monthNames[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`
                  : undefined
              }
              time={selectedTime || undefined}
              total={totalPrice}
              onContinue={handleContinue}
              continueDisabled={!selectedTime}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HeurePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Chargement...</div>}>
      <HeurePageContent />
    </Suspense>
  );
}
