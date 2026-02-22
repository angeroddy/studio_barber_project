'use client';

import { Suspense, useEffect, useState } from "react";
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

interface Professional {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  subtitle?: string;
  role?: string;
}

function ProfessionnelPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const salonId = searchParams.get("salon") || "championnet";
  const serviceParam = searchParams.get("service")?.trim() || "";

  const salon = salonsData[salonId as keyof typeof salonsData];

  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [service, setService] = useState<Service | null>(null);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    async function fetchStaff() {
      try {
        setLoadingStaff(true);
        const staffData = await api.staff.getStaffBySalon(salonId, true, true);
        setStaff(staffData);
      } catch (err) {
        console.error("Erreur lors du chargement du staff:", err);
        setStaff([]);
      } finally {
        setLoadingStaff(false);
      }
    }

    fetchStaff();
  }, [salonId]);

  const handleContinue = () => {
    if (selectedProfessional) {
      router.push(
        `/reserver/heure?salon=${salonId}&service=${serviceParam}&professional=${selectedProfessional.id}`
      );
    }
  };

  const formatDuration = (minutes: number): string => `${minutes} min`;

  const professionals: Professional[] = [
    {
      id: "any",
      name: "N'importe quel professionnel",
      subtitle: "pour une disponibilite maximale",
    },
    ...staff.map((s) => ({
      id: s.id,
      firstName: s.firstName,
      lastName: s.lastName,
      name: `${s.firstName} ${s.lastName}`,
      role: s.role,
    })),
  ];

  if (loading || loadingStaff) {
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

  const totalPrice = Number(service.price);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Link
          href={`/reserver/prestations?salon=${salonId}`}
          className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-gray-300 hover:border-[#DE2788] transition-colors mb-4 sm:mb-6"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 sm:w-7 sm:h-7">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Link>

        <BookingBreadcrumb
          items={[
            { label: "Prestations", href: `/reserver/prestations?salon=${salonId}` },
            { label: "Professionnel", active: true },
            { label: "Heure" },
            { label: "Valider" },
          ]}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2">
            <h1 className="font-archivo font-black text-3xl sm:text-4xl md:text-5xl text-black mb-6 sm:mb-8 lg:mb-10 uppercase">
              Selectionner un professionnel
            </h1>

            {staff.length === 0 && (
              <div className="bg-yellow-50 border border-yellow-300 p-4 mb-6">
                <p className="font-archivo text-sm text-yellow-800">
                  Aucun professionnel disponible pour ce salon. Vous pouvez continuer avec l'option "N'importe quel professionnel".
                </p>
              </div>
            )}

            <div className="space-y-3 sm:space-y-4">
              {professionals.map((pro) => (
                <div
                  key={pro.id}
                  className={`bg-white border p-4 sm:p-6 transition-all ${
                    selectedProfessional?.id === pro.id
                      ? "border-[#DE2788]"
                      : "border-black hover:border-[#DE2788]"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 sm:w-8 sm:h-8">
                          {pro.id === "any" ? (
                            <>
                              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                              <circle cx="9" cy="7" r="4" />
                              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </>
                          ) : (
                            <>
                              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                              <circle cx="12" cy="7" r="4" />
                            </>
                          )}
                        </svg>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-archivo font-black text-lg sm:text-xl text-black uppercase">
                          {pro.name}
                        </h3>
                        {pro.subtitle ? (
                          <p className="font-archivo text-xs sm:text-sm text-gray-600">
                            {pro.subtitle}
                          </p>
                        ) : pro.role ? (
                          <p className="font-archivo text-xs sm:text-sm text-gray-600">
                            {pro.role === "MANAGER" ? "Manager" : "Employe"}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedProfessional(pro)}
                      className={`w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 font-archivo font-black text-xs sm:text-sm uppercase transition-colors cursor-pointer ${
                        selectedProfessional?.id === pro.id
                          ? "bg-[#DE2788] text-white"
                          : "bg-black text-white hover:bg-[#DE2788]"
                      }`}
                    >
                      Selectionnez
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-1">
            <BookingSummary
              salon={salon}
              service={{
                name: service.name,
                duration: formatDuration(service.duration),
                price: Number(service.price),
              }}
              professional={
                selectedProfessional && selectedProfessional.id !== "any"
                  ? { name: selectedProfessional.name || "" }
                  : selectedProfessional?.id === "any"
                    ? { name: "n'importe quel professionnel" }
                    : undefined
              }
              total={totalPrice}
              onContinue={handleContinue}
              continueDisabled={!selectedProfessional}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfessionnelPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Chargement...</div>}>
      <ProfessionnelPageContent />
    </Suspense>
  );
}
