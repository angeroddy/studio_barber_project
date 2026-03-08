'use client';

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { BookingBreadcrumb } from "@/components/booking-breadcrumb";
import { api, Service, Staff } from "@/lib/api/index";
import { getSalonByIdentifier } from "@/lib/api/salonLookup";
import { Salon } from "@/lib/api/salon.api";

interface Professional {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  subtitle?: string;
  role?: string;
}

const DEFAULT_SALON_IMAGE = "/Championnet.avif";

function getSafeSalonImage(image?: unknown) {
  if (typeof image !== "string") return DEFAULT_SALON_IMAGE;

  const normalized = image.trim();
  return normalized.length > 0 ? normalized : DEFAULT_SALON_IMAGE;
}

function ProfessionnelPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const salonId = searchParams.get("salon") || "championnet";
  const serviceParam = searchParams.get("service")?.trim() || "";
  const [salon, setSalon] = useState<Salon | null>(null);

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
        const salonData = await getSalonByIdentifier(salonId);
        setSalon(salonData);
        setError(null);
      } catch (err) {
        console.error("Erreur lors du chargement de la prestation:", err);
        setError(err instanceof Error ? err.message : "Erreur lors du chargement de la prestation");
      } finally {
        setLoading(false);
      }
    }

    fetchService();
  }, [serviceParam, salonId]);

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

  const handleSelect = (pro: Professional) => {
    if (selectedProfessional?.id === pro.id) {
      setSelectedProfessional(null);
    } else {
      setSelectedProfessional(pro);
    }
  };

  const formatDuration = (minutes: number): string => `${minutes} min`;

  const professionals: Professional[] = [
    {
      id: "any",
      name: "Laisser le salon choisir",
      subtitle: "Accédez à plus de créneaux",
    },
    ...staff.map((s) => ({
      id: s.id,
      firstName: s.firstName,
      lastName: s.lastName,
      name: `${s.firstName}`,
      role: s.role,
    })),
  ];

  if (loading || loadingStaff) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-gray-300 border-t-[#DE2788] animate-spin" />
          <p className="font-sans text-sm text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="font-sans text-xl text-red-600 mb-4">
            {error || "Prestation introuvable"}
          </p>
          <Link
            href={`/reserver/prestations?salon=${salonId}`}
            className="font-sans text-sm text-gray-600 hover:text-[#DE2788] underline"
          >
            Retour aux prestations
          </Link>
        </div>
      </div>
    );
  }

  const totalPrice = Number(service.price);
  const isSelected = (proId: string) => selectedProfessional?.id === proId;
  const salonImage = salon ? getSafeSalonImage(salon.image) : DEFAULT_SALON_IMAGE;

  return (
    <div className="min-h-screen bg-white">
      {/* Header with back and close buttons */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14 sm:h-16">
          <Link
            href={`/reserver/prestations?salon=${salonId}`}
            className="inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-gray-200 hover:border-gray-400 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Link>

          {/* Mobile: truncated title in header */}
          <h2 className="sm:hidden font-sans font-semibold text-sm text-gray-900 truncate max-w-[200px]">
            Sélectionner un professionn...
          </h2>

          <Link
            href="/"
            className="inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-gray-200 hover:border-gray-400 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 pb-32 lg:pb-8">
        {/* Breadcrumb - desktop only */}
        <div className="hidden sm:block">
          <BookingBreadcrumb
            items={[
              { label: "Prestations", href: `/reserver/prestations?salon=${salonId}` },
              { label: "Professionnel", active: true },
              { label: "Heure" },
              { label: "Valider" },
            ]}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10">
          {/* Professional list */}
          <div className="lg:col-span-2">
            <h1 className="font-sans font-bold text-2xl sm:text-3xl md:text-4xl text-gray-900 mb-6 sm:mb-8">
              Sélectionner un professionnel
            </h1>

            {staff.length === 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                <p className="font-sans text-sm text-amber-800">
                  Aucun professionnel disponible pour ce salon.
                </p>
              </div>
            )}

            <div className="space-y-3">
              {professionals.map((pro) => {
                const selected = isSelected(pro.id);
                return (
                  <button
                    key={pro.id}
                    onClick={() => handleSelect(pro)}
                    className={`w-full rounded-xl border-2 p-4 sm:p-5 transition-all duration-200 cursor-pointer text-left ${
                      selected
                        ? "border-[#DE2788] bg-[#DE2788]/5 shadow-sm"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-center gap-3 sm:gap-4">
                      {/* Avatar */}
                      <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shrink-0 ${
                        pro.id === "any" ? "bg-[#FCE7F3]" : "bg-[#FCE7F3]"
                      }`}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#DE2788" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 sm:w-7 sm:h-7">
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

                      {/* Name and subtitle */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-sans font-semibold text-base sm:text-lg text-gray-900">
                          {pro.name}
                        </h3>
                        {pro.subtitle ? (
                          <p className="font-sans text-sm text-gray-500">
                            {pro.subtitle}
                          </p>
                        ) : (
                          <p className="font-sans text-sm text-gray-500">
                            Voir le profil
                          </p>
                        )}
                      </div>

                      {/* Select button or checkmark */}
                      {selected ? (
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#DE2788] flex items-center justify-center shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                      ) : (
                        <span className="hidden sm:inline-flex px-5 py-2 rounded-full border border-gray-300 font-sans text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shrink-0">
                          Sélectionnez
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Desktop sidebar summary */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 sticky top-24 shadow-sm">
              {/* Salon info */}
              {salon && (
                <div className="flex items-start gap-3 mb-5 pb-5 border-b border-gray-100">
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={salonImage}
                      alt={salon.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-sans font-semibold text-sm text-gray-900 leading-tight">
                      {salon.name}
                    </h3>
                    <p className="font-sans text-xs text-gray-500 mt-0.5 truncate">
                      {salon.address}
                    </p>
                  </div>
                </div>
              )}

              {/* Service details */}
              <div className="mb-5 pb-5 border-b border-gray-100">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-sans text-sm text-gray-900">
                      {service.name}
                    </p>
                    <p className="font-sans text-xs text-gray-500 mt-0.5">
                      {formatDuration(service.duration)}
                      {selectedProfessional && selectedProfessional.id !== "any"
                        ? ` avec ${selectedProfessional.name}`
                        : ""}
                    </p>
                  </div>
                  <span className="font-sans font-semibold text-sm text-gray-900 whitespace-nowrap">
                    {totalPrice} €
                  </span>
                </div>
              </div>

              {/* Total */}
              <div className="flex items-center justify-between mb-6">
                <span className="font-sans font-semibold text-base text-gray-900">
                  Total
                </span>
                <span className="font-sans font-bold text-lg text-gray-900">
                  {totalPrice} €
                </span>
              </div>

              {/* Continue button */}
              <button
                onClick={handleContinue}
                disabled={!selectedProfessional}
                className="w-full bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-sans font-semibold text-sm py-3.5 rounded-xl transition-colors"
              >
                Continuez
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 lg:hidden z-20">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-sans font-bold text-base text-gray-900">
              {totalPrice} €
            </p>
            <p className="font-sans text-xs text-gray-500">
              1 prestation · {formatDuration(service.duration)}
            </p>
          </div>
          <button
            onClick={handleContinue}
            disabled={!selectedProfessional}
            className="bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-sans font-semibold text-sm px-8 py-3 rounded-xl transition-colors"
          >
            Continuez
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProfessionnelPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-gray-300 border-t-[#DE2788] animate-spin" />
          <p className="font-sans text-sm text-gray-500">Chargement...</p>
        </div>
      </div>
    }>
      <ProfessionnelPageContent />
    </Suspense>
  );
}
