'use client';

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/index";

interface SalonWithStatus {
  id: string;
  name: string;
  slug?: string;
  address: string;
  city?: string;
  image?: string;
  isOpen: boolean;
  closingTime?: string;
}

export default function ReserverPage() {
  const router = useRouter();
  const [salons, setSalons] = useState<SalonWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSalons() {
      try {
        setLoading(true);
        const data = await api.salons.getAllSalons();

        // Enrichir les données des salons avec les horaires
        const salonsWithStatus = await Promise.all(
          data.map(async (salon) => {
            try {
              const schedules = await api.salons.getSchedules(salon.id);
              const now = new Date();
              const currentDay = now.getDay(); // 0 = Dimanche, 1 = Lundi, ..., 6 = Samedi
              const currentTime = now.getHours() * 60 + now.getMinutes(); // Temps en minutes

              console.log(`🏪 ${salon.name} - Jour actuel: ${currentDay} (${['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'][currentDay]})`);
              console.log(`⏰ Heure actuelle: ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')} (${currentTime} min)`);
              console.log(`📅 Horaires disponibles:`, schedules);

              // Trouver l'horaire du jour actuel
              const todaySchedule = schedules.find(s => s.dayOfWeek === currentDay);

              console.log(`📋 Horaire du jour:`, todaySchedule);

              let isOpen = false;
              let closingTime = undefined;

              if (todaySchedule && !todaySchedule.isClosed) {
                // Vérifier si on a des timeSlots (structure avec plages horaires multiples)
                const timeSlots = (todaySchedule as any).timeSlots;

                if (timeSlots && Array.isArray(timeSlots) && timeSlots.length > 0) {
                  console.log(`📍 ${timeSlots.length} plage(s) horaire(s) trouvée(s)`);

                  // Vérifier si l'heure actuelle est dans l'une des plages
                  for (const slot of timeSlots) {
                    if (slot.startTime && slot.endTime) {
                      const [startHour, startMin] = slot.startTime.split(':').map(Number);
                      const [endHour, endMin] = slot.endTime.split(':').map(Number);
                      const startTimeInMin = startHour * 60 + startMin;
                      const endTimeInMin = endHour * 60 + endMin;

                      console.log(`  ⏰ Plage: ${slot.startTime} - ${slot.endTime}`);

                      if (currentTime >= startTimeInMin && currentTime < endTimeInMin) {
                        isOpen = true;
                        closingTime = slot.endTime;
                        console.log(`  ✅ Ouvert dans cette plage! Fermeture à ${slot.endTime}`);
                        break;
                      }
                    }
                  }

                  // Si pas ouvert maintenant, utiliser l'heure de fermeture de la dernière plage
                  if (!isOpen && timeSlots.length > 0) {
                    const lastSlot = timeSlots[timeSlots.length - 1];
                    if (lastSlot.endTime) {
                      closingTime = lastSlot.endTime;
                    }
                  }
                } else if ((todaySchedule as any).startTime && (todaySchedule as any).endTime) {
                  // Fallback pour l'ancien format (startTime/endTime directs)
                  const schedule = todaySchedule as any;
                  const [startHour, startMin] = schedule.startTime.split(':').map(Number);
                  const [endHour, endMin] = schedule.endTime.split(':').map(Number);
                  const startTimeInMin = startHour * 60 + startMin;
                  const endTimeInMin = endHour * 60 + endMin;

                  console.log(`⏰ Plage horaire: ${schedule.startTime} (${startTimeInMin} min) - ${schedule.endTime} (${endTimeInMin} min)`);

                  isOpen = currentTime >= startTimeInMin && currentTime < endTimeInMin;
                  closingTime = schedule.endTime;
                  console.log(`✅ Dans la plage? ${isOpen}`);
                }
              }

              if (!isOpen) {
                console.log(`❌ Salon fermé ou pas dans les heures d'ouverture`);
              }

              // Déterminer l'image en fonction du nom ou slug du salon
              const getDefaultImage = (salonName: string, salonSlug?: string) => {
                // Normaliser pour enlever les accents
                const normalize = (str: string) =>
                  str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

                const name = normalize(salonName || salonSlug || '');

                console.log(`🖼️ Recherche image pour: "${salonName}" → normalisé: "${name}"`);

                if (name.includes('clemenceau')) {
                  console.log(`  → Image: /Clemenceau.avif`);
                  return '/Clemenceau.avif';
                }
                if (name.includes('championnet')) {
                  console.log(`  → Image: /Championnet.avif`);
                  return '/Championnet.avif';
                }

                console.log(`  → Image par défaut: /Championnet.avif`);
                return '/Championnet.avif'; // Image par défaut
              };

              return {
                id: salon.id,
                name: salon.name,
                slug: salon.slug,
                address: salon.address,
                city: salon.city,
                image: salon.image || getDefaultImage(salon.name, salon.slug),
                isOpen,
                closingTime,
              };
            } catch (err) {
              console.error(`Erreur lors de la récupération des horaires pour ${salon.name}:`, err);

              // Déterminer l'image en fonction du nom ou slug du salon
              const getDefaultImage = (salonName: string, salonSlug?: string) => {
                // Normaliser pour enlever les accents
                const normalize = (str: string) =>
                  str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

                const name = normalize(salonName || salonSlug || '');

                console.log(`🖼️ Recherche image pour: "${salonName}" → normalisé: "${name}"`);

                if (name.includes('clemenceau')) {
                  console.log(`  → Image: /Clemenceau.avif`);
                  return '/Clemenceau.avif';
                }
                if (name.includes('championnet')) {
                  console.log(`  → Image: /Championnet.avif`);
                  return '/Championnet.avif';
                }

                console.log(`  → Image par défaut: /Championnet.avif`);
                return '/Championnet.avif'; // Image par défaut
              };

              return {
                id: salon.id,
                name: salon.name,
                slug: salon.slug,
                address: salon.address,
                city: salon.city,
                image: salon.image || getDefaultImage(salon.name, salon.slug),
                isOpen: false,
                closingTime: undefined,
              };
            }
          })
        );

        setSalons(salonsWithStatus);
      } catch (err: any) {
        console.error('Erreur lors du chargement des salons:', err);
        setError(err.message || 'Erreur lors du chargement des salons');
        // Fallback to mock data if API fails
        setSalons([
          {
            id: "championnet",
            name: "Studio Barber Championnet",
            address: "42 Rue Lesdiguieres",
            city: "Grenoble",
            image: "/Championnet.avif",
            isOpen: true,
            closingTime: "19:00",
          },
          {
            id: "clemenceau",
            name: "Studio Barber Clemenceau",
            address: "47 Boulevard Clemenceau",
            city: "Grenoble",
            image: "/Clemenceau.avif",
            isOpen: true,
            closingTime: "19:00",
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
            className="bg-white border-2 border-gray-200 overflow-hidden hover:border-[#DE2788] hover:shadow-lg transition-all duration-300 cursor-pointer"
          >
            <div className="flex flex-col sm:flex-row gap-0">
              {/* Image */}
              {salon.image && (
                <div className="relative w-full h-56 sm:w-48 sm:h-48 md:w-56 md:h-56 shrink-0 overflow-hidden">
                  <Image
                    src={salon.image}
                    alt={salon.name}
                    fill
                    className="object-cover transition-transform duration-300 hover:scale-105"
                    priority
                  />
                </div>
              )}

              {/* Info */}
              <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between">
                <div>
                  <h2 className="font-archivo font-black text-xl sm:text-2xl md:text-3xl text-black mb-2 sm:mb-3 uppercase">
                    {salon.name}
                  </h2>
                  <p className="font-archivo text-sm sm:text-base text-gray-600 mb-3 sm:mb-4 flex items-start gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    {salon.address}{salon.city ? `, ${salon.city}` : ''}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                  {salon.isOpen && salon.closingTime ? (
                    <span className="text-green-600 font-archivo font-bold text-sm sm:text-base uppercase">
                      Ouvert jusqu&apos;à {salon.closingTime}
                    </span>
                  ) : (
                    <span className="text-red-600 font-archivo font-bold text-sm sm:text-base uppercase">
                      Fermé
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
