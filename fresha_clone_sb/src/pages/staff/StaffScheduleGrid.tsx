import { useState, useEffect } from "react";
import { getStaffBySalon, upsertStaffSchedulesForDay } from "../../services/staff.service";
import type { Staff, StaffSchedule } from "../../services/staff.service";
import { useSalon } from "../../context/SalonContext";
import StaffScheduleModal from "./StaffScheduleModal";
import "./StaffScheduleGrid.css";

interface DayColumn {
  dayOfWeek: number;
  dayName: string;
  dayNumber: number;
  monthName: string;
  fullDate: Date;
  totalHours: number;
}

const StaffScheduleGrid: React.FC = () => {
  const { selectedSalon } = useSalon();
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getStartOfWeek(new Date()));
  const [staffMembers, setStaffMembers] = useState<Staff[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // État pour le modal d'édition
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<number>(0);

  // Calcule le début de la semaine (lundi)
  function getStartOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Ajuste pour commencer le lundi
    return new Date(d.setDate(diff));
  }

  // Génère les 7 jours de la semaine
  function getWeekDays(): DayColumn[] {
    const days: DayColumn[] = [];
    const dayNames = ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"];
    const monthNames = ["janv", "févr", "mars", "avr", "mai", "juin", "juil", "août", "sept", "oct", "nov", "déc"];

    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(currentWeekStart.getDate() + i);

      days.push({
        dayOfWeek: date.getDay(),
        dayName: dayNames[date.getDay()],
        dayNumber: date.getDate(),
        monthName: monthNames[date.getMonth()],
        fullDate: date,
        totalHours: 0, // Sera calculé plus tard
      });
    }

    return days;
  }

  // Navigation : semaine précédente
  const navigateToPreviousWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() - 7);
    setCurrentWeekStart(newStart);
  };

  // Navigation : semaine suivante
  const navigateToNextWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() + 7);
    setCurrentWeekStart(newStart);
  };

  // Formate la plage de dates pour l'en-tête (ex: "19 - 25 janv., 2026")
  const getWeekRange = (): string => {
    const weekDays = getWeekDays();
    const firstDay = weekDays[0];
    const lastDay = weekDays[6];
    const year = lastDay.fullDate.getFullYear();

    if (firstDay.monthName === lastDay.monthName) {
      return `${firstDay.dayNumber} - ${lastDay.dayNumber} ${lastDay.monthName}, ${year}`;
    } else {
      return `${firstDay.dayNumber} ${firstDay.monthName} - ${lastDay.dayNumber} ${lastDay.monthName}, ${year}`;
    }
  };

  // Détermine si c'est la semaine courante
  const getWeekLabel = (): string => {
    const today = new Date();
    const todayWeekStart = getStartOfWeek(today);

    if (currentWeekStart.getTime() === todayWeekStart.getTime()) {
      return "Cette semaine";
    } else if (currentWeekStart > todayWeekStart) {
      const diffWeeks = Math.round((currentWeekStart.getTime() - todayWeekStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
      return diffWeeks === 1 ? "Semaine suivante" : `Dans ${diffWeeks} semaines`;
    } else {
      const diffWeeks = Math.round((todayWeekStart.getTime() - currentWeekStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
      return diffWeeks === 1 ? "Semaine précédente" : `Il y a ${diffWeeks} semaines`;
    }
  };

  // Calcule la durée en heures entre deux heures (format "HH:mm")
  const calculateDuration = (startTime: string, endTime: string): number => {
    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    return (endMinutes - startMinutes) / 60; // Retourne en heures
  };

  // Obtient TOUS les horaires pour un staff à un jour donné
  const getSchedulesForDay = (staff: Staff, dayOfWeek: number): StaffSchedule[] => {
    if (!staff.schedules || staff.schedules.length === 0) return [];

    return staff.schedules.filter(s => s.dayOfWeek === dayOfWeek);
  };

  // Calcule le total d'heures pour un staff sur la semaine
  const getTotalWeekHours = (staff: Staff): number => {
    if (!staff.schedules || staff.schedules.length === 0) return 0;

    return staff.schedules.reduce((total, schedule) => {
      if (schedule.isAvailable) {
        return total + calculateDuration(schedule.startTime, schedule.endTime);
      }
      return total;
    }, 0);
  };

  // Calcule le total d'heures pour tous les staff à un jour donné
  const getTotalDayHours = (dayOfWeek: number): number => {
    return staffMembers.reduce((total, staff) => {
      const schedules = getSchedulesForDay(staff, dayOfWeek);
      // Additionner toutes les plages horaires du jour
      const dayTotal = schedules.reduce((sum, schedule) => {
        if (schedule.isAvailable) {
          return sum + calculateDuration(schedule.startTime, schedule.endTime);
        }
        return sum;
      }, 0);
      return total + dayTotal;
    }, 0);
  };

  // Formate les heures pour l'affichage (ex: "18 h", "14 h", "0 min")
  const formatHours = (hours: number): string => {
    if (hours === 0) return "0 min";

    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);

    if (m === 0) {
      return `${h} h`;
    } else {
      return `${h} h ${m} min`;
    }
  };

  // Charge les membres du staff
  useEffect(() => {
    const fetchStaff = async () => {
      if (!selectedSalon?.id) return;

      try {
        setLoading(true);
        setError(null);
        const data = await getStaffBySalon(selectedSalon.id);
        setStaffMembers(data.filter(s => s.isActive)); // Seulement les actifs
      } catch (err) {
        console.error("Erreur lors du chargement du staff:", err);
        setError("Impossible de charger les membres du staff");
      } finally {
        setLoading(false);
      }
    };

    fetchStaff();
  }, [selectedSalon]);

  const weekDays = getWeekDays();

  // Gestion du clic sur une cellule
  const handleCellClick = (staff: Staff, day: DayColumn) => {
    setSelectedStaff(staff);
    setSelectedDate(day.fullDate);
    setSelectedDayOfWeek(day.dayOfWeek);
    setIsModalOpen(true);
  };

  // Sauvegarde des horaires modifiés
  const handleSaveSchedule = async (timeSlots: any[], isWorking: boolean) => {
    if (!selectedStaff?.id) {
      throw new Error("Staff non sélectionné");
    }

    try {
      // Utiliser la nouvelle API qui supporte plusieurs plages horaires par jour
      const schedulesToSave = isWorking && timeSlots.length > 0 ? timeSlots : [];

      await upsertStaffSchedulesForDay(
        selectedStaff.id,
        selectedDayOfWeek,
        schedulesToSave
      );

      // Recharger les données
      if (selectedSalon?.id) {
        const data = await getStaffBySalon(selectedSalon.id);
        setStaffMembers(data.filter(s => s.isActive));
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      throw error;
    }
  };

  const handleCopyToOtherDays = async (
    sourceDayOfWeek: number,
    targetDays: number[],
    timeSlots: any[],
    isWorking: boolean
  ) => {
    if (!selectedStaff?.id) {
      throw new Error("Staff non sélectionné");
    }

    try {
      const schedulesToSave = isWorking && timeSlots.length > 0 ? timeSlots : [];

      // Sauvegarder les horaires pour chaque jour cible
      for (const dayOfWeek of targetDays) {
        await upsertStaffSchedulesForDay(
          selectedStaff.id,
          dayOfWeek,
          schedulesToSave
        );
      }

      // Recharger les données
      if (selectedSalon?.id) {
        const data = await getStaffBySalon(selectedSalon.id);
        setStaffMembers(data.filter(s => s.isActive));
      }
    } catch (error) {
      console.error("Erreur lors de la copie:", error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="schedule-grid-container">
        <div className="flex items-center justify-center py-20">
          <div className="loading-spinner"></div>
          <span className="ml-3 text-gray-600">Chargement...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="schedule-grid-container">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="schedule-grid-container">
      {/* En-tête de navigation */}
      <div className="schedule-header">
        <div className="schedule-header-nav">
          <button
            onClick={navigateToPreviousWeek}
            className="nav-button"
            aria-label="Semaine précédente"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>

          <div className="week-info">
            <span className="week-label">{getWeekLabel()}</span>
            <span className="week-range">{getWeekRange()}</span>
          </div>

          <button
            onClick={navigateToNextWeek}
            className="nav-button"
            aria-label="Semaine suivante"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Grille principale */}
      <div className="schedule-grid">
        {/* En-tête de la grille */}
        <div className="grid-header">
          {/* Colonne staff */}
          <div className="staff-header-cell">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Membre de l'équipe</span>
              <button className="text-blue-600 text-sm hover:underline">
                Modifier
              </button>
            </div>
          </div>

          {/* Colonnes des 7 jours */}
          {weekDays.map((day, index) => (
            <div key={index} className="day-header-cell">
              <div className="day-name">
                {day.dayName}., {day.dayNumber} {day.monthName}.
              </div>
              <div className="day-total-hours">
                {formatHours(getTotalDayHours(day.dayOfWeek))}
              </div>
            </div>
          ))}
        </div>

        {/* Lignes du staff */}
        {staffMembers.length === 0 ? (
          <div className="empty-state">
            <p className="text-gray-500">Aucun membre du staff actif</p>
          </div>
        ) : (
          staffMembers.map((staff) => (
            <div key={staff.id} className="staff-row">
              {/* Colonne info staff */}
              <div className="staff-info-cell">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
                    {staff.firstName[0]}{staff.lastName[0]}
                  </div>
                  <div className="flex-1">
                    <div className="staff-name">
                      {staff.firstName} {staff.lastName}
                    </div>
                    <div className="staff-total-hours">
                      {formatHours(getTotalWeekHours(staff))}
                    </div>
                  </div>
                  <button
                    className="edit-staff-button"
                    aria-label={`Modifier ${staff.firstName} ${staff.lastName}`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Cellules des 7 jours */}
              {weekDays.map((day, index) => {
                const schedules = getSchedulesForDay(staff, day.dayOfWeek);
                const isWorking = schedules.length > 0 && schedules.some(s => s.isAvailable);

                return (
                  <div
                    key={index}
                    className={`schedule-cell ${isWorking ? "schedule-cell-active" : "schedule-cell-inactive"}`}
                    onClick={() => handleCellClick(staff, day)}
                  >
                    {isWorking ? (
                      <div className="schedule-time">
                        {schedules.map((schedule, idx) => (
                          <div key={schedule.id || idx}>
                            {schedule.startTime} - {schedule.endTime}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="schedule-no-work">Ne travaille pas</div>
                    )}
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* Note informative */}
      <div className="schedule-info-note">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5 text-blue-500"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18"
              />
            </svg>
          </div>
          <div className="flex-1 text-sm text-gray-600">
            La liste des membres de l'équipe indique les plages horaires disponibles pour la prise de rendez-vous,
            mais elle n'est pas liée aux heures d'ouverture standard de votre entreprise.
            Pour définir vos heures d'ouverture standard,{" "}
            <button className="text-blue-600 hover:underline font-medium">
              cliquez ici
            </button>.
          </div>
        </div>
      </div>

      {/* Modal d'édition des horaires */}
      <StaffScheduleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        staff={selectedStaff}
        date={selectedDate}
        dayOfWeek={selectedDayOfWeek}
        existingSchedules={
          selectedStaff && selectedDayOfWeek !== undefined
            ? getSchedulesForDay(selectedStaff, selectedDayOfWeek)
            : []
        }
        onSave={handleSaveSchedule}
        onCopyToOtherDays={handleCopyToOtherDays}
      />
    </div>
  );
};

export default StaffScheduleGrid;
