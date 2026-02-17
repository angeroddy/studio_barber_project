'use client';

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/index";

export default function ReserverPage() {
  const router = useRouter();
  const [salons, setSalons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSalons() {
      try {
        setLoading(true);
        const data = await api.salons.getAllSalons();
        setSalons(data);
      } catch (err: any) {
        console.error('Erreur lors du chargement des salons:', err);
        setError(err.message || 'Erreur lors du chargement des salons');
        // Fallback to mock data if API fails
        setSalons([
          {
            id: "championnet",
            name: "Studio Barber Championnet",
            address: "42 Rue Lesdiguieres, Grenoble",
            image: "/Championnet.avif",
            status: "Ouvert",
            closingTime: "12:00",
          },
          {
            id: "clemenceau",
            name: "Studio Barber Clemenceau",
            address: "47 Boulevard Clemenceau, Grenoble",
            image: "/Clemenceau.avif",
            status: "Ouvert",
            closingTime: "12:00",
          },
        ]);
      } finally {
        setLoading(false);
      }
    }

    fetchSalons();
  }, []);

  const handleSalonSelect = (salonId: string) => {
    router.push(`/reserver/prestations?salon=${salonId}`);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10 md:py-12">
      {/* Back button */}
      <Link
        href="/"
        className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-gray-300 hover:border-[#DE2788] transition-colors mb-6 sm:mb-8"
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

      {/* Title */}
      <h1 className="font-archivo font-black text-3xl sm:text-4xl md:text-5xl text-black mb-6 sm:mb-8 uppercase">
        Choisissez un etablissement
      </h1>

      {/* Loading state */}
      {loading && (
        <div className="text-center py-12">
          <p className="font-archivo text-xl text-gray-600">Chargement des salons...</p>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="bg-yellow-50 border border-yellow-300 p-4 mb-6">
          <p className="font-archivo text-sm text-yellow-800">
            ⚠️ Connexion au serveur impossible. Affichage des données de démonstration.
          </p>
        </div>
      )}

      {/* Salon cards */}
      <div className="space-y-4 sm:space-y-6 mb-8 sm:mb-12">
        {!loading && salons.map((salon) => (
          <div
            key={salon.id}
            onClick={() => handleSalonSelect(salon.id)}
            className="bg-white border border-black overflow-hidden hover:border-[#DE2788] transition-all duration-300 cursor-pointer"
          >
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 p-4 sm:p-6">
              {/* Image */}
              {salon.image && (
                <div className="relative w-full h-48 sm:w-32 sm:h-32 md:w-40 md:h-40 flex-shrink-0">
                  <Image
                    src={salon.image}
                    alt={salon.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              {/* Info */}
              <div className="flex-1">
                <h2 className="font-archivo font-black text-xl sm:text-2xl text-black mb-2 sm:mb-3 uppercase">
                  {salon.name}
                </h2>
                <p className="font-archivo text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
                  {salon.address}{salon.city ? `, ${salon.city}` : ''}
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <span className="text-green-600 font-archivo font-bold text-xs sm:text-sm uppercase">
                    {salon.status || 'Ouvert'}
                  </span>
                  {salon.closingTime && (
                    <span className="font-archivo text-xs sm:text-sm text-gray-500">
                      - ferme bientot a {salon.closingTime}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

    
    </div>
  );
}
