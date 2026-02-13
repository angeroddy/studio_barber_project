'use client';

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { BookingBreadcrumb } from "@/components/booking-breadcrumb";
import { BookingSummary } from "@/components/booking-summary";
import { api, Service } from "@/lib/api/index";

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

// Type pour les services groupés par catégorie
interface ServicesByCategory {
  [category: string]: Service[];
}

function PrestationsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const salonId = searchParams.get("salon") || "championnet";
  const salon = salonsData[salonId as keyof typeof salonsData];

  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [servicesByCategory, setServicesByCategory] = useState<ServicesByCategory>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les services depuis l'API
  useEffect(() => {
    async function fetchServices() {
      try {
        setLoading(true);
        const services = await api.services.getServicesBySalon(salonId);

        // Grouper les services par catégorie
        const grouped = services.reduce((acc: ServicesByCategory, service) => {
          const category = service.category || 'Autres';
          if (!acc[category]) {
            acc[category] = [];
          }
          acc[category].push(service);
          return acc;
        }, {});

        setServicesByCategory(grouped);
        setError(null);
      } catch (err) {
        console.error('Erreur lors du chargement des services:', err);
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement des services');
      } finally {
        setLoading(false);
      }
    }

    fetchServices();
  }, [salonId]);

  const handleServiceSelect = (service: Service) => {
    setSelectedServices(prev => {
      const isAlreadySelected = prev.some(s => s.id === service.id);
      if (isAlreadySelected) {
        // Retirer le service
        return prev.filter(s => s.id !== service.id);
      } else {
        // Ajouter le service
        return [...prev, service];
      }
    });
  };

  const handleContinue = () => {
    if (selectedServices.length > 0) {
      const serviceIds = selectedServices.map(s => s.id).join(',');
      router.push(`/reserver/professionnel?salon=${salonId}&services=${serviceIds}`);
    }
  };

  // Calculer le total
  const totalPrice = selectedServices.reduce((sum, service) => sum + Number(service.price), 0);
  const totalDuration = selectedServices.reduce((sum, service) => sum + service.duration, 0);

  // Helper function to format duration
  const formatDuration = (minutes: number): string => {
    return `${minutes} min`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Back button */}
        <Link
          href="/reserver"
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

        {/* Breadcrumb */}
        <BookingBreadcrumb
          items={[
            { label: "Prestations", active: true },
            { label: "Professionnel" },
            { label: "Heure" },
            { label: "Valider" },
          ]}
        />

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left: Services */}
          <div className="lg:col-span-2">
            <h1 className="font-archivo font-black text-3xl sm:text-4xl md:text-5xl text-black mb-6 sm:mb-8 lg:mb-10 uppercase">
              Prestations
            </h1>

            {/* Loading state */}
            {loading && (
              <div className="text-center py-12">
                <p className="font-archivo text-xl text-gray-600">Chargement des prestations...</p>
              </div>
            )}

            {/* Error state */}
            {error && !loading && (
              <div className="bg-yellow-50 border-2 border-yellow-300 p-4 mb-6">
                <p className="font-archivo text-sm text-yellow-800">
                  Erreur lors du chargement des prestations. Veuillez réessayer.
                </p>
              </div>
            )}

            {/* Services grouped by category */}
            {!loading && !error && Object.entries(servicesByCategory).map(([category, categoryServices]) => (
              <div key={category} className="mb-8 sm:mb-10 lg:mb-12">
                <h2 className="font-archivo font-black text-2xl sm:text-3xl text-black mb-4 sm:mb-6 uppercase">
                  {category}
                </h2>
                <div className="space-y-3 sm:space-y-4">
                  {categoryServices.map((service) => (
                  <div
                    key={service.id}
                    className={`bg-white border-2 p-4 sm:p-6 transition-all cursor-pointer ${
                      selectedServices.some(s => s.id === service.id)
                        ? "border-[#DE2788]"
                        : "border-black hover:border-[#DE2788]"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-archivo font-black text-lg sm:text-xl text-black mb-1 sm:mb-2 uppercase">
                          {service.name}
                        </h3>
                        <p className="font-archivo text-sm sm:text-base text-gray-600 mb-2 sm:mb-3">
                          {formatDuration(service.duration)}
                        </p>
                        {service.description && (
                          <p className="font-archivo text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3 leading-relaxed">
                            {service.description}
                          </p>
                        )}
                        <p className="font-archivo font-black text-xl sm:text-2xl text-black">
                          {service.price} €
                        </p>
                      </div>
                      <button
                        onClick={() => handleServiceSelect(service)}
                        className={`w-10 h-10 sm:w-12 sm:h-12 border-2 flex items-center justify-center transition-colors shrink-0 cursor-pointer ${
                          selectedServices.some(s => s.id === service.id)
                            ? "bg-[#DE2788] border-[#DE2788] text-white"
                            : "border-black text-black hover:bg-[#DE2788] hover:border-[#DE2788] hover:text-white"
                        }`}
                      >
                        {selectedServices.some(s => s.id === service.id) ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="w-6 h-6 sm:w-7 sm:h-7"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : (
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
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                  ))}
                </div>
              </div>
            ))}

            {/* No services message */}
            {!loading && !error && Object.keys(servicesByCategory).length === 0 && (
              <div className="text-center py-12">
                <p className="font-archivo text-xl text-gray-600">Aucune prestation disponible pour le moment.</p>
              </div>
            )}
          </div>

          {/* Right: Summary */}
          <div className="lg:col-span-1">
            <BookingSummary
              salon={salon}
              services={selectedServices.map(s => ({
                name: s.name,
                duration: formatDuration(s.duration),
                price: s.price,
              }))}
              totalDuration={formatDuration(totalDuration)}
              total={totalPrice}
              onContinue={handleContinue}
              continueDisabled={selectedServices.length === 0}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PrestationsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Chargement...</div>}>
      <PrestationsPageContent />
    </Suspense>
  );
}
