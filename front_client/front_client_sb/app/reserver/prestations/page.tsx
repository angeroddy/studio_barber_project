'use client';

import { Suspense, useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { BookingBreadcrumb } from "@/components/booking-breadcrumb";
import { BookingSummary } from "@/components/booking-summary";
import { api, Salon, Service } from "@/lib/api/index";
import { getSalonByIdentifier } from "@/lib/api/salonLookup";

interface ServicesByCategory {
  [category: string]: Service[];
}

function PrestationsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const salonId = searchParams.get("salon") || "championnet";

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [servicesByCategory, setServicesByCategory] = useState<ServicesByCategory>({});
  const [activeTab, setActiveTab] = useState<string>("");
  const [salon, setSalon] = useState<Salon | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Detect scroll to toggle compact header
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    async function fetchServices() {
      try {
        setLoading(true);
        const [services, salonData] = await Promise.all([
          api.services.getServicesBySalon(salonId),
          getSalonByIdentifier(salonId),
        ]);

        const grouped = services.reduce((acc: ServicesByCategory, service) => {
          const category = service.category || 'Autres';
          if (!acc[category]) acc[category] = [];
          acc[category].push(service);
          return acc;
        }, {});

        setServicesByCategory(grouped);
        setSalon(salonData);
        const sortedCategories = Object.keys(grouped).sort((a, b) => {
          const categoryOrder = ['La formule', 'Coupes', 'Barbe'];
          const ia = categoryOrder.indexOf(a);
          const ib = categoryOrder.indexOf(b);
          if (ia !== -1 && ib !== -1) return ia - ib;
          if (ia !== -1) return -1;
          if (ib !== -1) return 1;
          return a.localeCompare(b);
        });
        if (sortedCategories.length > 0) setActiveTab(sortedCategories[0]);
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
    setSelectedService(prev => (prev?.id === service.id ? null : service));
  };

  const handleContinue = () => {
    if (selectedService) {
      router.push(`/reserver/professionnel?salon=${salonId}&service=${selectedService.id}`);
    }
  };

  const handleTabClick = (category: string) => {
    setActiveTab(category);
    const el = sectionRefs.current[category];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Ordre prioritaire des catégories
  const categoryOrder = ['La formule', 'Coupes', 'Barbe'];
  const categories = Object.keys(servicesByCategory).sort((a, b) => {
    const ia = categoryOrder.indexOf(a);
    const ib = categoryOrder.indexOf(b);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return a.localeCompare(b);
  });

  const totalPrice = selectedService ? Number(selectedService.price) : 0;
  const totalDuration = selectedService ? selectedService.duration : 0;

  const formatDuration = (minutes: number): string => `${minutes} min`;

  // Inline tab rendering helper
  const renderTabs = () => (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => handleTabClick(cat)}
          aria-pressed={activeTab === cat}
          className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-archivo font-bold transition-colors cursor-pointer ${
            activeTab === cat
              ? 'bg-black text-white'
              : 'bg-white text-black border border-gray-300 hover:border-black'
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );

  // Inline toggle button helper
  const renderToggle = (service: Service) => {
    const isSelected = selectedService?.id === service.id;
    return (
      <span
        aria-hidden="true"
        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${
          isSelected
            ? 'bg-[#DE2788] text-white'
            : 'border-2 border-gray-300 text-gray-400 hover:border-gray-500'
        }`}
      >
        {isSelected ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        )}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ═══ MOBILE HEADER (< lg) ═══ */}
      <div className="lg:hidden sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-2">
          <button type="button" onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" />
              <path d="m12 19-7-7 7-7" />
            </svg>
          </button>
          <span className={`font-archivo font-black text-base text-black transition-opacity duration-200 ${scrolled ? 'opacity-100' : 'opacity-0'}`}>
            Prestations
          </span>
          <Link href="/" className="w-10 h-10 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </Link>
        </div>
        {/* Tabs in header when scrolled */}
        {!loading && categories.length > 0 && (
          <div className={`px-4 overflow-hidden transition-all duration-200 ${scrolled ? 'max-h-20 pb-2' : 'max-h-0'}`}>
            {renderTabs()}
          </div>
        )}
      </div>

      {/* ═══ MOBILE LAYOUT (< lg) ═══ */}
      <div className="lg:hidden bg-white min-h-screen px-4 pb-32">
        <h1 className="font-archivo font-black text-2xl text-black mt-4 mb-5">Prestations</h1>

        {/* Inline tabs when not scrolled */}
        {!loading && categories.length > 0 && (
          <div className={`mb-2 transition-opacity duration-200 ${scrolled ? 'opacity-0 pointer-events-none h-0 overflow-hidden' : 'opacity-100'}`}>
            {renderTabs()}
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <p className="font-archivo text-gray-500">Chargement des prestations...</p>
          </div>
        )}

        {error && !loading && (
          <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mb-6">
            <p className="font-archivo text-sm text-yellow-800">Erreur lors du chargement. Veuillez réessayer.</p>
          </div>
        )}

        {/* Mobile services */}
        {!loading && !error && categories.map((category) => (
          <div
            key={category}
            ref={(el) => { sectionRefs.current[category] = el; }}
            className="mb-6 scroll-mt-36"
          >
                <h2 className="font-archivo font-black text-lg text-black mb-3">{category}</h2>
            <div className="divide-y divide-gray-100">
              {servicesByCategory[category].map((service) => (
                <button
                  type="button"
                  aria-pressed={selectedService?.id === service.id}
                  key={service.id}
                  onClick={() => handleServiceSelect(service)}
                  className="w-full flex items-center justify-between gap-4 py-4 text-left bg-transparent cursor-pointer"
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="font-archivo font-bold text-black text-[15px]">{service.name}</p>
                    <p className="font-archivo text-sm text-gray-500 mt-0.5">{formatDuration(service.duration)}</p>
                    <p className="font-archivo font-black text-black text-[15px] mt-1">{service.price} €</p>
                  </div>
                  {renderToggle(service)}
                </button>
              ))}
            </div>
          </div>
        ))}

        {!loading && !error && categories.length === 0 && (
          <div className="text-center py-12">
            <p className="font-archivo text-gray-500">Aucune prestation disponible.</p>
          </div>
        )}
      </div>

      {/* ═══ MOBILE STICKY BOTTOM BAR (< lg) ═══ */}
      <div
        className={`lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 transition-transform duration-300 ${
          selectedService ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="px-4 py-4 flex items-center justify-between">
          <div>
            <p className="font-archivo font-black text-black text-lg">{totalPrice} €</p>
            <p className="font-archivo text-sm text-gray-500">🛒 1 prestation · {totalDuration} min</p>
          </div>
          <button
            type="button"
            onClick={handleContinue}
            className="bg-black text-white font-archivo font-black text-sm px-6 py-3 rounded-full hover:bg-gray-800 transition-colors cursor-pointer"
          >
            Continuez
          </button>
        </div>
      </div>

      {/* ═══ DESKTOP LAYOUT (>= lg) ═══ */}
      <div className="hidden lg:block">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-4">
            <Link href="/reserver" className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-gray-300 hover:border-[#DE2788] transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </Link>
            <Link href="/" className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-gray-300 hover:border-[#DE2788] transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </Link>
          </div>

          <BookingBreadcrumb
            items={[
              { label: "Prestations", active: true },
              { label: "Professionnel" },
              { label: "Heure" },
              { label: "Valider" },
            ]}
          />

          <div className="grid grid-cols-3 gap-8">
            <div className="col-span-2">
              <h1 className="font-archivo font-black text-4xl text-black mb-8">Prestations</h1>

              {!loading && categories.length > 0 && <div className="mb-4">{renderTabs()}</div>}

              {loading && (
                <div className="text-center py-12">
                  <p className="font-archivo text-xl text-gray-600">Chargement des prestations...</p>
                </div>
              )}

              {error && !loading && (
                <div className="bg-yellow-50 border border-yellow-300 p-4 mb-6">
                  <p className="font-archivo text-sm text-yellow-800">Erreur lors du chargement. Veuillez réessayer.</p>
                </div>
              )}

              {/* Desktop services */}
              {!loading && !error && categories.map((category) => (
                <div key={category} className="mb-8">
                  <h2 className="font-archivo font-black text-xl text-black mb-3">{category}</h2>
                    <div className="space-y-3">
                    {servicesByCategory[category].map((service) => (
                  <button
                    type="button"
                    key={service.id}
                    onClick={() => handleServiceSelect(service)}
                    className={`w-full cursor-pointer text-left bg-white border rounded-lg p-5 transition-all ${
                      selectedService?.id === service.id
                        ? 'border-[#DE2788] shadow-sm'
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                    aria-pressed={selectedService?.id === service.id}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0 pr-4">
                        <p className="font-archivo font-bold text-black">{service.name}</p>
                        <p className="font-archivo text-sm text-gray-500 mt-1">{formatDuration(service.duration)}</p>
                        <p className="font-archivo font-black text-black mt-2">{service.price} €</p>
                      </div>
                      {renderToggle(service)}
                    </div>
                  </button>
                ))}
              </div>
                </div>
              ))}

              {!loading && !error && categories.length === 0 && (
                <div className="text-center py-12">
                  <p className="font-archivo text-xl text-gray-600">Aucune prestation disponible.</p>
                </div>
              )}
            </div>

            <div className="col-span-1">
              <BookingSummary
                salon={
                  salon
                    ? {
                        name: salon.name,
                        address: salon.address,
                        image: salon.image || "/Championnet.avif",
                      }
                    : undefined
                }
                service={selectedService ? {
                  name: selectedService.name,
                  duration: formatDuration(selectedService.duration),
                  price: Number(selectedService.price),
                } : undefined}
                total={totalPrice}
                onContinue={handleContinue}
                continueDisabled={!selectedService}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PrestationsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center font-archivo">Chargement...</div>}>
      <PrestationsPageContent />
    </Suspense>
  );
}
