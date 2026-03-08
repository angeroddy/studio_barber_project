'use client';

import { Suspense, useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { BookingBreadcrumb } from "@/components/booking-breadcrumb";
import { BookingSummary } from "@/components/booking-summary";
import { api, Service, Staff } from "@/lib/api/index";
import { getSalonByIdentifier, getSalonClosedDaysByIdentifier } from "@/lib/api/salonLookup";
import { Salon } from "@/lib/api/salon.api";

const monthNames = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre"
];

const dayNames = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];
const calendarWeekDayNames = ["lun.", "mar.", "mer.", "jeu.", "ven.", "sam.", "dim."];

const getDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const createDateFromKey = (dateKey: string): Date => {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const getMonthDateKeys = (monthDate: Date): string[] => {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  return Array.from({ length: daysInMonth }, (_, index) =>
    getDateKey(new Date(year, month, index + 1))
  );
};

const getDateKeysInRange = (startDate: Date, numberOfDays: number): string[] =>
  Array.from({ length: numberOfDays }, (_, index) => {
    const date = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    date.setDate(date.getDate() + index);
    return getDateKey(date);
  });

// ─── DateStrip Component ──────────────────────────────────────────────
interface DateStripDay {
  date: Date;
  number: number;
  dayName: string;
  isPast: boolean;
  isToday: boolean;
  isClosed: boolean; // e.g. dimanche
}

type DateAvailabilityState = "available" | "unavailable" | "loading";

function DateStrip({
  selectedDate,
  onSelect,
  closedDays = [0], // dimanche par défaut
  unavailableDateKeys = new Set<string>(),
  onVisibleMonthChange,
}: {
  selectedDate: Date | null;
  onSelect: (date: Date) => void;
  closedDays?: number[];
  unavailableDateKeys?: Set<string>;
  onVisibleMonthChange?: (date: Date) => void;
}) {
  const today = useMemo(() => new Date(), []);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const todayStart = useMemo(
    () => new Date(today.getFullYear(), today.getMonth(), today.getDate()),
    [today]
  );
  const selectedOffsetDays = useMemo(() => {
    if (!selectedDate) return 0;
    const selectedStart = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate()
    );
    return Math.max(
      0,
      Math.ceil((selectedStart.getTime() - todayStart.getTime()) / 86400000)
    );
  }, [selectedDate, todayStart]);
  const [visibleMonthDate, setVisibleMonthDate] = useState(todayStart);

  // Générer les jours à afficher
  const days: DateStripDay[] = useMemo(() => {
    const result: DateStripDay[] = [];
    const totalDays = Math.max(120, selectedOffsetDays + 30);

    for (let i = 0; i < totalDays; i++) {
      const d = new Date(todayStart);
      d.setDate(d.getDate() + i);
      const dStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());

      result.push({
        date: d,
        number: d.getDate(),
        dayName: dayNames[d.getDay()],
        isPast: dStart < todayStart,
        isToday: dStart.getTime() === todayStart.getTime(),
        isClosed: closedDays.includes(d.getDay()),
      });
    }
    return result;
  }, [todayStart, closedDays, selectedOffsetDays]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container || days.length === 0) return;

    let frameId = 0;

    const updateVisibleMonth = () => {
      frameId = 0;
      const containerRect = container.getBoundingClientRect();
      const dayItems = container.querySelectorAll<HTMLElement>("[data-day-index]");
      const containerCenterX = containerRect.left + containerRect.width / 2;
      let closestIndex = 0;
      let closestDistance = Number.POSITIVE_INFINITY;
      for (const item of dayItems) {
        const rect = item.getBoundingClientRect();
        if (rect.right <= containerRect.left || rect.left >= containerRect.right) continue;

        const itemCenterX = rect.left + rect.width / 2;
        const distance = Math.abs(itemCenterX - containerCenterX);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = Number(item.dataset.dayIndex ?? 0);
        }
      }

      const centerVisibleDay = days[closestIndex] ?? days[0];
      if (!centerVisibleDay) return;

      setVisibleMonthDate((current) => {
        if (
          current.getMonth() === centerVisibleDay.date.getMonth() &&
          current.getFullYear() === centerVisibleDay.date.getFullYear()
        ) {
          return current;
        }
        return centerVisibleDay.date;
      });

      onVisibleMonthChange?.(centerVisibleDay.date);
    };

    const onScroll = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(updateVisibleMonth);
    };

    updateVisibleMonth();
    container.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      container.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, [days, onVisibleMonthChange]);

  useEffect(() => {
    if (!selectedDate || !scrollRef.current) return;

    const selectedKey = getDateKey(selectedDate);
    const selectedItem = scrollRef.current.querySelector<HTMLElement>(
      `[data-date-key="${selectedKey}"]`
    );

    if (selectedItem) {
      selectedItem.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [selectedDate, days.length]);

  // Mois/année affiché (basé sur le premier jour visible dans le scroll)
  const displayMonth = `${monthNames[visibleMonthDate.getMonth()]} ${visibleMonthDate.getFullYear()}`;
  const scrollDates = (direction: "prev" | "next") => {
    const container = scrollRef.current;
    if (!container) return;

    const amount = Math.max(220, Math.floor(container.clientWidth * 0.55));
    container.scrollBy({
      left: direction === "prev" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="font-sans font-medium text-sm text-gray-900">
          {displayMonth}
        </p>
        <div className="hidden md:flex items-center gap-1">
          <button
            type="button"
            onClick={() => scrollDates("prev")}
            aria-label="Voir les jours précédents"
            className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => scrollDates("next")}
            aria-label="Voir les jours suivants"
            className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Day circles */}
      <div ref={scrollRef} className="overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex w-max items-start gap-2 sm:gap-3 snap-x snap-mandatory touch-pan-x">
          {days.map((day, index) => {
            const isSelected =
              selectedDate &&
              day.date.toDateString() === selectedDate.toDateString();
            const disabled =
              day.isPast ||
              day.isClosed ||
              unavailableDateKeys.has(getDateKey(day.date));

            return (
              <button
                key={day.date.toISOString()}
                onClick={() => !disabled && onSelect(day.date)}
                disabled={disabled}
                data-day-index={index}
                data-date-key={getDateKey(day.date)}
                className="flex flex-col items-center gap-1 flex-none w-[72px] sm:w-[76px] snap-start"
              >
                <div
                  className={`w-15 h-15 sm:w-15 sm:h-15 p-5 rounded-full flex items-center justify-center text-3xl sm:text-3xl font-semibold leading-none transition-all ${
                    isSelected
                      ? "bg-[#DE2788] text-white shadow-md"
                      : disabled
                        ? "bg-gray-100 text-gray-300"
                        : "bg-white text-gray-900 border border-gray-200 hover:border-[#DE2788] hover:text-[#DE2788]"
                  }`}
                >
                  {day.number}
                </div>
                <span
                  className={`text-xs font-medium ${
                    isSelected
                      ? "text-[#DE2788]"
                      : disabled
                        ? "text-gray-300"
                        : "text-gray-500"
                  }`}
                >
                  {day.dayName}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── ProfessionalPill Component ───────────────────────────────────────
function ProfessionalPill({
  name,
  initial,
  isAny,
  onClick,
}: {
  name: string;
  initial: string;
  isAny?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 bg-white hover:border-gray-300 transition-colors"
    >
      <div className="w-6 h-6 rounded-full bg-[#FCE7F3] flex items-center justify-center">
        {isAny ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#DE2788" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        ) : (
          <span className="text-xs font-semibold text-[#DE2788]">{initial}</span>
        )}
      </div>
      <span className="font-sans text-sm font-medium text-gray-900">{name}</span>
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>
  );
}

// ─── CalendarIconButton ───────────────────────────────────────────────
function CalendarIconButton({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:border-gray-400 transition-colors"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    </button>
  );
}

interface CalendarPickerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  closedDays?: number[];
  minDate?: Date;
  unavailableDateKeys?: Set<string>;
  onViewMonthChange?: (date: Date) => void;
}

function CalendarPicker({
  isOpen,
  onClose,
  selectedDate,
  onSelectDate,
  closedDays = [0],
  minDate,
  unavailableDateKeys = new Set<string>(),
  onViewMonthChange,
}: CalendarPickerProps) {
  const minSelectableDate = useMemo(() => {
    const source = minDate ?? new Date();
    return new Date(source.getFullYear(), source.getMonth(), source.getDate());
  }, [minDate]);

  const [viewMonth, setViewMonth] = useState(() => {
    const base = selectedDate ?? minSelectableDate;
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  useEffect(() => {
    onViewMonthChange?.(viewMonth);
  }, [onViewMonthChange, viewMonth]);

  if (!isOpen) return null;

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthStartOffset = (firstOfMonth.getDay() + 6) % 7; // lundi = 0
  const totalCells = Math.ceil((monthStartOffset + daysInMonth) / 7) * 7;

  const cells = Array.from({ length: totalCells }, (_, i) => {
    const dayNumber = i - monthStartOffset + 1;
    if (dayNumber < 1 || dayNumber > daysInMonth) return null;

    const date = new Date(year, month, dayNumber);
    const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const isClosed = closedDays.includes(date.getDay());
    const isPast = dateStart < minSelectableDate;
    const isUnavailable = unavailableDateKeys.has(getDateKey(date));

    return {
      date,
      dayNumber,
      disabled: isClosed || isPast || isUnavailable,
    };
  });

  const goPrevMonth = () => {
    setViewMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1));
  };

  const goNextMonth = () => {
    setViewMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1));
  };

  return (
    <div className="fixed inset-0 z-40">
      <button
        type="button"
        onClick={onClose}
        aria-label="Fermer le calendrier"
        className="absolute inset-0 bg-black/20"
      />

      <div className="absolute inset-x-0 bottom-0 md:inset-0 md:flex md:items-center md:justify-center md:p-6">
        <div className="relative w-full bg-white rounded-t-3xl md:rounded-2xl md:max-w-[620px] p-5 md:p-8 shadow-xl border border-gray-100 max-h-[80vh] overflow-y-auto">
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="absolute right-4 top-4 md:hidden inline-flex items-center justify-center w-8 h-8 text-gray-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <div className="flex items-center justify-between mt-8 md:mt-0 mb-6">
            <button
              type="button"
              onClick={goPrevMonth}
              aria-label="Mois précédent"
              className="inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-gray-100 text-gray-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            <p className="font-sans font-bold text-2xl md:text-3xl text-gray-900">
              {monthNames[month]} {year}
            </p>

            <button
              type="button"
              onClick={goNextMonth}
              aria-label="Mois suivant"
              className="inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-gray-100 text-gray-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-7 gap-y-2 mb-4">
            {calendarWeekDayNames.map((name) => (
              <span key={name} className="text-center font-sans text-sm font-medium text-gray-500">
                {name}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-2">
            {cells.map((cell, idx) => {
              if (!cell) {
                return <div key={`empty-${idx}`} className="h-12" />;
              }

              const isSelected =
                selectedDate &&
                cell.date.toDateString() === selectedDate.toDateString();

              return (
                <button
                  key={getDateKey(cell.date)}
                  type="button"
                  disabled={cell.disabled}
                  onClick={() => {
                    onSelectDate(cell.date);
                    onClose();
                  }}
                  className={`h-12 w-12 mx-auto rounded-full flex items-center justify-center font-sans text-2xl font-semibold transition-colors ${
                    isSelected
                      ? "bg-[#DE2788] text-white"
                      : cell.disabled
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  {cell.dayNumber}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

interface ProfessionalSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceName: string;
  staff: Staff[];
  selectedProfessionalId: string;
  onSelectProfessional: (id: string) => void;
  loadingStaff?: boolean;
}

function ProfessionalSelectorModal({
  isOpen,
  onClose,
  serviceName,
  staff,
  selectedProfessionalId,
  onSelectProfessional,
  loadingStaff = false,
}: ProfessionalSelectorModalProps) {
  if (!isOpen) return null;

  const options = [
    {
      id: "any",
      name: "Laisser le salon choisir",
      subtitle: "Accédez à plus de créneaux",
      isAny: true,
    },
    ...staff.map((member) => ({
      id: member.id,
      name: member.firstName,
      subtitle: "Voir le profil",
      isAny: false,
    })),
  ];

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        onClick={onClose}
        aria-label="Fermer le sélecteur de coiffeur"
        className="absolute inset-0 bg-black/30"
      />

      <div className="absolute inset-0 flex items-end sm:items-center sm:justify-center sm:p-6">
        <div className="relative w-full h-[92vh] sm:h-auto sm:max-h-[86vh] sm:max-w-[760px] bg-white rounded-t-3xl sm:rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
          <div className="sticky top-0 z-10 bg-white px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-sans font-bold text-2xl sm:text-[36px] text-gray-900 truncate pr-4">
              {serviceName}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="inline-flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 text-gray-700 transition-colors shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="px-4 sm:px-6 py-3 overflow-y-auto max-h-[calc(92vh-82px)] sm:max-h-[calc(86vh-90px)]">
            {loadingStaff && (
              <div className="py-10 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-gray-300 border-t-[#DE2788] animate-spin" />
              </div>
            )}

            {!loadingStaff && (
              <div className="space-y-3">
                {options.map((option) => {
                  const isSelected = selectedProfessionalId === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => {
                        onSelectProfessional(option.id);
                        onClose();
                      }}
                      className={`w-full p-4 sm:p-5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? "border-[#DE2788] bg-[#FDECF5]"
                          : "border-[#D7DCE5] bg-white hover:border-[#C6CFDB]"
                      }`}
                    >
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-16 h-16 rounded-full bg-[#FCE7F3] flex items-center justify-center shrink-0">
                          {option.isAny ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#DE2788" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                              <circle cx="9" cy="7" r="4" />
                              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#DE2788" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                              <circle cx="12" cy="7" r="4" />
                            </svg>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-sans font-semibold text-base sm:text-lg leading-tight text-[#0E1A2A]">
                            {option.name}
                          </p>
                          <p className="font-sans text-sm sm:text-base leading-tight text-[#61708A] mt-1">
                            {option.subtitle}
                          </p>
                        </div>

                        {isSelected ? (
                          <div className="w-11 h-11 rounded-full bg-[#DE2788] flex items-center justify-center shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </div>
                        ) : (
                          <span className="shrink-0 inline-flex items-center justify-center px-4 py-1.5 rounded-full border border-[#CCD3DF] bg-white font-sans text-sm sm:text-base font-medium text-[#1A2433]">
                            Sélectionnez
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── No Slots Message ─────────────────────────────────────────────────
function NoSlotsMessage({
  professionalName,
  professionalInitial,
  nextAvailableDate,
  onGoToNext,
  isLoadingNextDate,
  noSlotActionLabel,
}: {
  professionalName: string;
  professionalInitial: string;
  nextAvailableDate?: string;
  onGoToNext?: () => void;
  isLoadingNextDate?: boolean;
  noSlotActionLabel?: string;
}) {
  return (
    <div className="bg-gray-50 rounded-2xl p-6 sm:p-8 flex flex-col items-center text-center">
      <div className="w-10 h-10 rounded-full bg-[#FCE7F3] flex items-center justify-center mb-4">
        <span className="text-sm font-semibold text-[#DE2788]">{professionalInitial}</span>
      </div>
      <p className="font-sans font-semibold text-base text-gray-900 mb-1">
        {professionalName} n&apos;a plus aucun créneau disponible à cette date
      </p>
      {nextAvailableDate ? (
        <p className="font-sans text-sm text-gray-500 mb-5">
          Créneaux disponibles à partir de {nextAvailableDate}
        </p>
      ) : (
        <p className="font-sans text-sm text-gray-500 mb-5">
          Aucun créneau n&apos;est disponible pour cette date.
        </p>
      )}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {onGoToNext && (
          <button
            onClick={onGoToNext}
            disabled={isLoadingNextDate}
            className="px-5 py-2.5 rounded-full border border-gray-300 font-sans text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            {isLoadingNextDate ? "Recherche..." : noSlotActionLabel || "Voir la prochaine date"}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────
function HeurePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const salonId = searchParams.get("salon") || "championnet";
  const serviceParam = searchParams.get("service")?.trim() || "";
  const initialProfessionalId = searchParams.get("professional") || "any";

  const [salon, setSalon] = useState<Salon | null>(null);
  const [service, setService] = useState<Service | null>(null);
  const [professional, setProfessional] = useState<Staff | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [closedDays, setClosedDays] = useState<number[]>([0]);
  const [nextAvailableDateLabel, setNextAvailableDateLabel] = useState<string | null>(null);
  const [loadingNextDate, setLoadingNextDate] = useState(false);
  const [dateAvailability, setDateAvailability] = useState<Record<string, DateAvailabilityState>>({});

  const today = useMemo(() => new Date(), []);
  const [selectedDate, setSelectedDate] = useState<Date | null>(today);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState(initialProfessionalId);
  const [isProfessionalSelectorOpen, setIsProfessionalSelectorOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const preloadedRangesRef = useRef<Set<string>>(new Set());

  const totalPrice = service ? Number(service.price) : 0;
  const unavailableDateKeys = useMemo(
    () =>
      new Set(
        Object.entries(dateAvailability)
          .filter(([, state]) => state === "unavailable")
          .map(([dateKey]) => dateKey)
      ),
    [dateAvailability]
  );

  useEffect(() => {
    async function loadSalonData() {
      try {
        const [salonData, salonClosedDays] = await Promise.all([
          getSalonByIdentifier(salonId),
          getSalonClosedDaysByIdentifier(salonId),
        ]);
        setSalon(salonData);
        setClosedDays(salonClosedDays.length ? salonClosedDays : [0]);
      } catch (err) {
        console.error("Erreur lors du chargement du salon:", err);
        setSalon(null);
        setClosedDays([0]);
      }
    }

    void loadSalonData();
  }, [salonId]);

  // Fetch service
  useEffect(() => {
    async function fetchService() {
      if (!serviceParam) {
        setError("Aucune prestation sélectionnée");
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

  const fetchAvailabilityForDateKeys = useCallback(
    async (dateKeys: string[], force = false) => {
      if (!service) {
        return;
      }

      const uniqueDateKeys = Array.from(new Set(dateKeys))
        .filter((dateKey) => {
          const date = createDateFromKey(dateKey);
          return !closedDays.includes(date.getDay());
        })
        .filter((dateKey) => {
          if (force) {
            return true;
          }
          const state = dateAvailability[dateKey];
          return state !== "available" && state !== "unavailable" && state !== "loading";
        });

      if (uniqueDateKeys.length === 0) {
        return;
      }

      setDateAvailability((current) => {
        const next = { ...current };
        for (const dateKey of uniqueDateKeys) {
          next[dateKey] = "loading";
        }
        return next;
      });

      const batchSize = 6;
      for (let index = 0; index < uniqueDateKeys.length; index += batchSize) {
        const batch = uniqueDateKeys.slice(index, index + batchSize);
        const results = await Promise.allSettled(
          batch.map(async (dateKey) => {
            const slots = await api.bookings.getAvailableSlots(
              salonId,
              selectedProfessionalId,
              service.id,
              dateKey
            );

            return {
              dateKey,
              hasSlots: slots.length > 0,
            };
          })
        );

        setDateAvailability((current) => {
          const next = { ...current };
          results.forEach((result, batchIndex) => {
            const dateKey = batch[batchIndex];
            if (!dateKey) {
              return;
            }

            next[dateKey] =
              result.status === "fulfilled" && result.value.hasSlots
                ? "available"
                : "unavailable";
          });
          return next;
        });
      }
    },
    [closedDays, dateAvailability, salonId, selectedProfessionalId, service]
  );

  const prefetchDateRange = useCallback(
    async (startDate: Date, numberOfDays: number) => {
      if (!service) {
        return;
      }

      const startKey = getDateKey(startDate);
      const rangeKey = `${selectedProfessionalId}:${service.id}:${startKey}:${numberOfDays}`;
      if (preloadedRangesRef.current.has(rangeKey)) {
        return;
      }

      preloadedRangesRef.current.add(rangeKey);
      await fetchAvailabilityForDateKeys(getDateKeysInRange(startDate, numberOfDays));
    },
    [fetchAvailabilityForDateKeys, selectedProfessionalId, service]
  );

  const prefetchMonthAvailability = useCallback(
    async (monthDate: Date) => {
      if (!service) {
        return;
      }

      await fetchAvailabilityForDateKeys(getMonthDateKeys(monthDate));
    },
    [fetchAvailabilityForDateKeys, service]
  );

  const findNextAvailableDate = useCallback(async () => {
    if (!selectedDate || !service) {
      return null;
    }

    setLoadingNextDate(true);
    setNextAvailableDateLabel(null);

    const startDate = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate()
    );

    try {
      for (let dayOffset = 1; dayOffset <= 45; dayOffset += 1) {
        const candidateDate = new Date(startDate);
        candidateDate.setDate(startDate.getDate() + dayOffset);

        if (closedDays.includes(candidateDate.getDay())) {
          continue;
        }

        const year = candidateDate.getFullYear();
        const month = String(candidateDate.getMonth() + 1).padStart(2, "0");
        const day = String(candidateDate.getDate()).padStart(2, "0");
        const dateStr = `${year}-${month}-${day}`;

        const slots = await api.bookings.getAvailableSlots(
          salonId,
          selectedProfessionalId,
          service.id,
          dateStr
        );

        if (slots.length > 0) {
          return candidateDate;
        }
      }

      return null;
    } catch (err) {
      console.error("Erreur lors de la recherche d'une date disponible:", err);
      return null;
    } finally {
      setLoadingNextDate(false);
    }
  }, [closedDays, selectedDate, selectedProfessionalId, service, salonId]);

  const goToNextAvailableDate = async () => {
    const nextDate = await findNextAvailableDate();
    if (!nextDate) {
      setNextAvailableDateLabel("Aucune autre disponibilité trouvée.");
      return;
    }

    const label = `${nextDate.getDate()} ${monthNames[nextDate.getMonth()]} ${nextDate.getFullYear()}`;
    setNextAvailableDateLabel(label);
    setSelectedDate(nextDate);
    setSelectedTime(null);
  };

  // Fetch professional
  useEffect(() => {
    async function fetchProfessional() {
      if (!selectedProfessionalId || selectedProfessionalId === "any") {
        setProfessional(null);
        return;
      }

      const selectedFromStaff = staff.find((member) => member.id === selectedProfessionalId);
      if (selectedFromStaff) {
        setProfessional(selectedFromStaff);
        return;
      }

      try {
        const staffData = await api.staff.getStaffById(selectedProfessionalId);
        setProfessional(staffData);
      } catch (err) {
        console.error("Erreur lors du chargement du professionnel:", err);
        setProfessional(null);
      }
    }
    fetchProfessional();
  }, [selectedProfessionalId, staff]);

  // Fetch salon staff for selector
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

  // Fetch available slots
  useEffect(() => {
    async function fetchAvailableSlots() {
      if (!selectedDate || !service) {
        setAvailableSlots([]);
        return;
      }
      try {
        setLoadingSlots(true);
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
        const day = String(selectedDate.getDate()).padStart(2, "0");
        const dateStr = `${year}-${month}-${day}`;

        const slots = await api.bookings.getAvailableSlots(
          salonId,
          selectedProfessionalId,
          service.id,
          dateStr
        );
        setAvailableSlots(slots);
      } catch (err) {
        console.error("Erreur lors du chargement des créneaux:", err);
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    }
    fetchAvailableSlots();
  }, [selectedDate, salonId, selectedProfessionalId, service]);

  // Reset selected time when slots change
  useEffect(() => {
    if (!loadingSlots && selectedTime && !availableSlots.includes(selectedTime)) {
      setSelectedTime(null);
    }
  }, [availableSlots, selectedTime, loadingSlots]);

  useEffect(() => {
    setNextAvailableDateLabel(null);
  }, [selectedDate, selectedProfessionalId, service]);

  useEffect(() => {
    preloadedRangesRef.current.clear();
    setDateAvailability({});
  }, [selectedProfessionalId, service?.id, salonId]);

  useEffect(() => {
    if (!service) {
      return;
    }

    void prefetchDateRange(today, 120);
    void prefetchMonthAvailability(selectedDate ?? today);
  }, [prefetchDateRange, prefetchMonthAvailability, selectedDate, service, today]);

  const handleContinue = useCallback(() => {
    if (selectedTime && selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const day = String(selectedDate.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;

      const params = new URLSearchParams({
        salon: salonId,
        service: serviceParam,
        professional: selectedProfessionalId,
        date: dateStr,
        time: selectedTime,
      });
      router.push(`/reserver/valider?${params.toString()}`);
    }
  }, [selectedTime, selectedDate, salonId, serviceParam, selectedProfessionalId, router]);

  const formatDuration = (minutes: number): string => `${minutes} min`;

  const professionalName = professional
    ? professional.firstName
    : selectedProfessionalId === "any"
      ? "Laisser le salon choisir"
      : "Professionnel";

  const professionalInitial = professional
    ? professional.firstName.charAt(0).toUpperCase()
    : selectedProfessionalId === "any"
      ? "S"
      : "P";

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-gray-300 border-t-[#DE2788] animate-spin" />
          <p className="font-sans text-sm text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  // Error state
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

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14 sm:h-16">
          <Link
            href={`/reserver/professionnel?salon=${salonId}&service=${serviceParam}`}
            className="inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-gray-200 hover:border-gray-400 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Link>

          <h2 className="sm:hidden font-sans font-semibold text-sm text-gray-900 truncate max-w-[200px]">
            Sélectionnez l&apos;heure
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
              { label: "Professionnel", href: `/reserver/professionnel?salon=${salonId}&service=${serviceParam}` },
              { label: "Heure", active: true },
              { label: "Valider" },
            ]}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10">
          {/* Left: Date & Time selection */}
          <div className="lg:col-span-2">
            <h1 className="font-sans font-bold text-2xl sm:text-3xl md:text-4xl text-gray-900 mb-6 sm:mb-8">
              Sélectionnez l&apos;heure
            </h1>

            {/* Professional pill + calendar icon */}
            <div className="flex items-center justify-between mb-6">
              <ProfessionalPill
                name={professionalName}
                initial={professionalInitial}
                isAny={selectedProfessionalId === "any"}
                onClick={() => setIsProfessionalSelectorOpen(true)}
              />
              <CalendarIconButton onClick={() => setIsCalendarOpen(true)} />
            </div>

            {/* Date strip */}
            <div className="mb-8">
              <DateStrip
                selectedDate={selectedDate}
                onSelect={(date) => {
                  setSelectedDate(date);
                  setSelectedTime(null);
                }}
                closedDays={closedDays}
                unavailableDateKeys={unavailableDateKeys}
                onVisibleMonthChange={(date) => {
                  void prefetchMonthAvailability(date);
                }}
              />
            </div>

            {/* Time slots */}
            <div className="space-y-3">
              {loadingSlots && (
                <div className="py-12 flex flex-col items-center gap-3">
                  <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-[#DE2788] animate-spin" />
                  <p className="font-sans text-sm text-gray-500">
                    Chargement des créneaux...
                  </p>
                </div>
              )}

              {!loadingSlots && availableSlots.length === 0 && (
                <NoSlotsMessage
                  professionalName={professionalName}
                  professionalInitial={professionalInitial}
                  onGoToNext={goToNextAvailableDate}
                  isLoadingNextDate={loadingNextDate}
                  nextAvailableDate={nextAvailableDateLabel || undefined}
                  noSlotActionLabel="Aller à la prochaine date dispo"
                />
              )}

              {!loadingSlots &&
                availableSlots.map((time) => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={`w-full px-5 py-4 rounded-xl border text-left font-sans text-sm font-medium transition-all cursor-pointer ${
                      selectedTime === time
                        ? "border-[#DE2788] bg-[#DE2788]/5 text-[#DE2788]"
                        : "border-gray-200 bg-white text-gray-900 hover:border-gray-300 hover:shadow-sm"
                    }`}
                  >
                    {time}
                  </button>
                ))}
            </div>
          </div>

          {/* Right: Desktop summary sidebar */}
          <div className="hidden lg:block lg:col-span-1">
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
              service={{
                name: service.name,
                duration: formatDuration(service.duration),
                price: Number(service.price),
              }}
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

      <CalendarPicker
        key={`${isCalendarOpen}-${getDateKey(selectedDate ?? today)}`}
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        selectedDate={selectedDate}
        onSelectDate={(date) => {
          setSelectedDate(date);
          setSelectedTime(null);
        }}
        closedDays={closedDays}
        minDate={today}
        unavailableDateKeys={unavailableDateKeys}
        onViewMonthChange={(date) => {
          void prefetchMonthAvailability(date);
        }}
      />

      <ProfessionalSelectorModal
        isOpen={isProfessionalSelectorOpen}
        onClose={() => setIsProfessionalSelectorOpen(false)}
        serviceName={service.name}
        staff={staff}
        selectedProfessionalId={selectedProfessionalId}
        loadingStaff={loadingStaff}
        onSelectProfessional={(id) => {
          setSelectedProfessionalId(id);
          setSelectedTime(null);
        }}
      />

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
            disabled={!selectedTime}
            className="bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-sans font-semibold text-sm px-8 py-3 rounded-xl transition-colors"
          >
            Continuez
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HeurePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="animate-pulse flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-gray-300 border-t-[#DE2788] animate-spin" />
            <p className="font-sans text-sm text-gray-500">Chargement...</p>
          </div>
        </div>
      }
    >
      <HeurePageContent />
    </Suspense>
  );
}
