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
  nextOpeningLabel?: string;
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

const dayLabels = [
  'dimanche',
  'lundi',
  'mardi',
  'mercredi',
  'jeudi',
  'vendredi',
  'samedi',
];

function formatDisplayTime(time: string): string {
  const [hours, minutes] = time.split(':');
  return minutes === '00' ? `${hours}h` : `${hours}h${minutes}`;
}

function getOrderedTimeSlots(schedule: Schedule): NonNullable<Schedule['timeSlots']> {
  return [...(schedule.timeSlots || [])].sort((a, b) => {
    const orderDelta = (a.order ?? 0) - (b.order ?? 0);
    if (orderDelta !== 0) return orderDelta;
    return toMinutes(a.startTime) - toMinutes(b.startTime);
  });
}

function getNextOpeningLabel(schedules: Schedule[] = [], now: Date): string | undefined {
  for (let offset = 0; offset < 7; offset++) {
    const dayOfWeek = (now.getDay() + offset) % 7;
    const schedule = schedules.find((item) => item.dayOfWeek === dayOfWeek);

    if (!schedule || schedule.isClosed) {
      continue;
    }

    const orderedTimeSlots = getOrderedTimeSlots(schedule);

    if (orderedTimeSlots.length > 0) {
      for (const slot of orderedTimeSlots) {
        if (!slot.startTime || !slot.endTime) continue;

        if (offset === 0 && toMinutes(slot.startTime) <= (now.getHours() * 60 + now.getMinutes())) {
          continue;
        }

        return `${dayLabels[dayOfWeek]} à ${formatDisplayTime(slot.startTime)}`;
      }

      continue;
    }

    if (!schedule.startTime || !schedule.endTime) {
      continue;
    }

    if (offset === 0 && toMinutes(schedule.startTime) <= (now.getHours() * 60 + now.getMinutes())) {
      continue;
    }

    return `${dayLabels[dayOfWeek]} à ${formatDisplayTime(schedule.startTime)}`;
  }

  return undefined;
}

function getSalonOpenStatus(schedules: Schedule[] = []): {
  isOpen: boolean;
  closingTime?: string;
  nextOpeningLabel?: string;
} {
  const now = new Date();
  const currentDay = now.getDay();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const todaySchedule = schedules.find((schedule) => schedule.dayOfWeek === currentDay);

  if (!todaySchedule || todaySchedule.isClosed) {
    return {
      isOpen: false,
      nextOpeningLabel: getNextOpeningLabel(schedules, now),
    };
  }

  const timeSlots = getOrderedTimeSlots(todaySchedule);

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

    return {
      isOpen: false,
      nextOpeningLabel: getNextOpeningLabel(schedules, now),
    };
  }

  if (todaySchedule.startTime && todaySchedule.endTime) {
    const scheduleStart = toMinutes(todaySchedule.startTime);
    const scheduleEnd = toMinutes(todaySchedule.endTime);
    const isOpen = currentTime >= scheduleStart && currentTime < scheduleEnd;

    return {
      isOpen,
      closingTime: todaySchedule.endTime,
      nextOpeningLabel: isOpen ? undefined : getNextOpeningLabel(schedules, now),
    };
  }

  return {
    isOpen: false,
    nextOpeningLabel: getNextOpeningLabel(schedules, now),
  };
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
          const { isOpen, closingTime, nextOpeningLabel } = getSalonOpenStatus(salon.schedules || []);

          return {
            id: salon.id,
            name: salon.name,
            slug: salon.slug,
            address: salon.address,
            city: salon.city,
            image: salon.image || getDefaultImage(salon.name, salon.slug),
            isOpen,
            closingTime,
            nextOpeningLabel,
          };
        });

        setSalons(salonsWithStatus);
      } catch (err: any) {
        console.error('Erreur lors du chargement des salons:', err);
        setError(err.message || 'Erreur lors du chargement des salons');
        setSalons([]);
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 md:py-12">
      <Link
        href="/"
        className="inline-flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-gray-200 hover:border-[#DE2788] transition-colors mb-6 sm:mb-8"
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

      <div className="mb-6 sm:mb-8">
        <h1 className="font-sans font-bold text-2xl sm:text-3xl text-gray-900">
          Studio Barber
        </h1>
        <p className="font-sans text-sm sm:text-base text-gray-600 mt-1">
          {salons.length} établissement{salons.length > 1 ? "s" : ""}
        </p>
      </div>

      {loading && (
        <div className="text-center py-12 sm:py-16">
          <p className="font-sans text-base sm:text-lg text-gray-600">Chargement des salons...</p>
        </div>
      )}

      {error && !loading && (
        <div className="bg-[#FFF7FB] border border-[#F6C7E0] rounded-xl p-4 mb-6">
          <p className="font-sans text-sm text-[#8F1E5A]">
            Connexion au serveur impossible. Affichage des donnees de demonstration.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-12">
        {!loading && salons.map((salon) => (
          <button
            key={salon.id}
            type="button"
            onClick={() => handleSalonSelect(salon.id)}
            className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-[#DE2788] hover:shadow-md transition-all duration-200 cursor-pointer text-left"
          >
            <div className="flex flex-col gap-0">
              {salon.image && (
                <div className="relative w-full h-52 sm:h-56 shrink-0 overflow-hidden">
                  <Image
                    src={salon.image}
                    alt={salon.name}
                    fill
                    className="object-cover transition-transform duration-300 hover:scale-105"
                    priority
                  />
                </div>
              )}

              <div className="flex-1 p-4 sm:p-5">
                <div>
                  <h2 className="font-sans font-bold text-xl sm:text-2xl text-gray-900 leading-tight mb-2">
                    {salon.name}
                  </h2>
                  <p className="font-sans text-sm sm:text-base text-gray-600 mb-2 leading-snug">
                    {salon.address}{salon.city ? `, ${salon.city}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {salon.isOpen && salon.closingTime ? (
                    <span className="text-[#1E8A5A] font-sans font-semibold text-sm sm:text-base">
                      Ouvert jusqu&apos;à {salon.closingTime}
                    </span>
                  ) : (
                    <span className="text-[#DE2788] font-sans font-semibold text-sm sm:text-base">
                      Fermé{salon.nextOpeningLabel ? `, ouvre ${salon.nextOpeningLabel}` : ''}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
