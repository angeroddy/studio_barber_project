'use client';

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, Salon, Schedule } from "@/lib/api/index";

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

function normalizeText(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function getDefaultImage(salonName: string, salonSlug?: string): string {
  const normalizedName = normalizeText(salonName || salonSlug || '');

  if (normalizedName.includes('clemenceau')) {
    return '/Clemenceau.avif';
  }

  if (normalizedName.includes('championnet')) {
    return '/Championnet.avif';
  }

  return '/Championnet.avif';
}

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function getSalonOpenStatus(schedules: Schedule[] = []): {
  isOpen: boolean;
  closingTime?: string;
} {
  const now = new Date();
  const currentDay = now.getDay();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const todaySchedule = schedules.find((schedule) => schedule.dayOfWeek === currentDay);

  if (!todaySchedule || todaySchedule.isClosed) {
    return { isOpen: false };
  }

  const timeSlots = todaySchedule.timeSlots || [];

  if (timeSlots.length > 0) {
    for (const slot of timeSlots) {
      if (!slot.startTime || !slot.endTime) continue;

      const slotStart = toMinutes(slot.startTime);
      const slotEnd = toMinutes(slot.endTime);
      if (currentTime >= slotStart && currentTime < slotEnd) {
        return {
          isOpen: true,
          closingTime: slot.endTime,
        };
      }
    }

    const lastSlot = timeSlots[timeSlots.length - 1];
    return {
      isOpen: false,
      closingTime: lastSlot?.endTime,
    };
  }

  if (todaySchedule.startTime && todaySchedule.endTime) {
    const scheduleStart = toMinutes(todaySchedule.startTime);
    const scheduleEnd = toMinutes(todaySchedule.endTime);

    return {
      isOpen: currentTime >= scheduleStart && currentTime < scheduleEnd,
      closingTime: todaySchedule.endTime,
    };
  }

  return { isOpen: false };
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
        const data = await api.salons.getAllSalons({
          includeSchedules: true,
          minimal: true,
        });

        const salonsWithStatus = data.map((salon: Salon) => {
          const { isOpen, closingTime } = getSalonOpenStatus(salon.schedules || []);

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
        });

        setSalons(salonsWithStatus);
      } catch (err: any) {
        console.error('Erreur lors du chargement des salons:', err);
        setError(err.message || 'Erreur lors du chargement des salons');

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

      <h1 className="font-archivo font-black text-3xl sm:text-4xl md:text-5xl text-black mb-6 sm:mb-8 uppercase">
        Choisissez un etablissement
      </h1>

      {loading && (
        <div className="text-center py-12">
          <p className="font-archivo text-xl text-gray-600">Chargement des salons...</p>
        </div>
      )}

      {error && !loading && (
        <div className="bg-yellow-50 border border-yellow-300 p-4 mb-6">
          <p className="font-archivo text-sm text-yellow-800">
            Connexion au serveur impossible. Affichage des donnees de demonstration.
          </p>
        </div>
      )}

      <div className="space-y-4 sm:space-y-6 mb-8 sm:mb-12">
        {!loading && salons.map((salon) => (
          <div
            key={salon.id}
            onClick={() => handleSalonSelect(salon.id)}
            className="bg-white border-2 border-gray-200 overflow-hidden hover:border-[#DE2788] hover:shadow-lg transition-all duration-300 cursor-pointer"
          >
            <div className="flex flex-col sm:flex-row gap-0">
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
                      Ouvert jusqu&apos;a {salon.closingTime}
                    </span>
                  ) : (
                    <span className="text-red-600 font-archivo font-bold text-sm sm:text-base uppercase">
                      Ferme
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
