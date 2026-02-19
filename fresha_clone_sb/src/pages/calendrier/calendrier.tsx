import { useState, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventInput, DateSelectArg, EventClickArg } from "@fullcalendar/core";
import frLocale from "@fullcalendar/core/locales/fr";
import { Modal } from "../../components/ui/modal";
import { useModal } from "../../hooks/useModal";
import Avatar from "../../components/ui/avatar/Avatar";
import { getStaffBySalon } from "../../services/staff.service";
import type { Staff } from "../../services/staff.service";
import {
  getBookingsBySalon,
  createBooking,
  updateBooking,
  deleteBooking,
} from "../../services/booking.service";
import type { Booking } from "../../services/booking.service";
import { getServicesBySalon } from "../../services/service.service";
import { getSchedulesBySalon } from "../../services/schedule.service";
import type { Schedule } from "../../services/schedule.service";
import { useSalon } from "../../context/SalonContext";
import ClientAutocomplete from "../../components/form/input/ClientAutocomplete";
import type { Client } from "../../services/client.service";
import "./calendrier.css";

interface HairdresserResource {
  id: string;
  title: string;
  avatar: string;
}

interface CalendarEvent extends EventInput {
  resourceId: string;
  title: string;
  start: string;
  end: string;
  backgroundColor?: string;
  borderColor?: string;
  extendedProps?: {
    service?: string;
    serviceId?: string; // ID du service pour les mises à jour
    resourceId?: string;
    bookingId?: string;
    bookingServiceId?: string;
    status?: string;
    clientEmail?: string;
    clientPhone?: string;
    notes?: string;
    isMultiService?: boolean;
    serviceOrder?: number;
    totalServices?: number;
  };
}

type TimeView = "day" | "week" | "month";
type ViewMode = "all" | "single";

interface CalendrierProps {
  readOnly?: boolean;
}

const CALENDAR_START_HOUR = 8;
const CALENDAR_VISIBLE_HOURS = 12;
const LUNCH_START_HOUR = 12;
const LUNCH_END_HOUR = 13;

const Calendrier: React.FC<CalendrierProps> = ({ readOnly = false }) => {
  // Utiliser le contexte salon
  const { selectedSalon, isLoading: salonLoading } = useSalon();
  const isCalendarReadOnly = readOnly;

  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [eventTitle, setEventTitle] = useState("");
  const [eventStartDate, setEventStartDate] = useState("");
  const [eventEndDate, setEventEndDate] = useState("");
  const [eventService, setEventService] = useState("");
  const [selectedResource, setSelectedResource] = useState("1");
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [timeView, setTimeView] = useState<TimeView>("day");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const calendarRef = useRef<FullCalendar>(null);
  const { isOpen, openModal, closeModal } = useModal();

  // États pour les données dynamiques
  const [hairdressers, setHairdressers] = useState<HairdresserResource[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Animation states
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // États pour le drag and drop
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // États pour la sélection de créneaux horaires
  const [selectedBookingDate, setSelectedBookingDate] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [availableTimeSlots, setAvailableTimeSlots] = useState<Array<{
    time: string;
    available: boolean;
  }>>([]);

  // État pour le client sélectionné
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Handlers pour le drag and drop dans les vues grilles personnalisées
  const handleDragStart = (event: CalendarEvent) => {
    setDraggedEvent(event);
    setIsDragging(true);
    console.log('🎯 [Drag] Début du drag:', event.title);
  };

  const handleDragEnd = () => {
    setDraggedEvent(null);
    setIsDragging(false);
    console.log('🎯 [Drag] Fin du drag');
  };

  const handleDrop = async (hairdresserId: string, hourIndex: number, date: Date = selectedDate) => {
    if (isCalendarReadOnly || !draggedEvent) return;

    const hour = hourIndex + CALENDAR_START_HOUR;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const oldStart = new Date(draggedEvent.start);
    const oldEnd = new Date(draggedEvent.end);
    const duration = oldEnd.getTime() - oldStart.getTime();

    const newStartTime = `${dateStr}T${String(hour).padStart(2, '0')}:00:00`;
    const newEndDate = new Date(newStartTime);
    newEndDate.setTime(newEndDate.getTime() + duration);
    const newEndTime = newEndDate.toISOString();

    console.log('🎯 [Drag] Drop:', {
      bookingId: draggedEvent.extendedProps?.bookingId,
      oldStart: draggedEvent.start,
      newStart: newStartTime,
      newEnd: newEndTime,
      newStaffId: hairdresserId,
    });

    if (!draggedEvent.extendedProps?.bookingId) {
      console.error('Pas de bookingId');
      handleDragEnd();
      return;
    }

    try {
      // Mettre à jour via l'API
      await updateBooking(draggedEvent.extendedProps.bookingId, {
        staffId: hairdresserId,
        startTime: newStartTime,
        endTime: newEndTime,
      });

      // Rafraîchir les données
      await fetchBookings();

      console.log('✅ [Drag] Booking déplacé avec succès');
    } catch (error) {
      console.error('Erreur lors du déplacement:', error);
      alert('Erreur lors du déplacement du rendez-vous.');
    } finally {
      handleDragEnd();
    }
  };

  // Palette de couleurs uniques pour chaque coiffeur
  const staffColors = [
    { bg: "#BFDBFE", border: "#93C5FD" },      // Bleu clair
    { bg: "#FED7AA", border: "#FDBA74" },      // Orange clair
    { bg: "#FBCFE8", border: "#F9A8D4" },      // Rose
    { bg: "#5EEAD4", border: "#2DD4BF" },      // Turquoise
    { bg: "#C7D2FE", border: "#A5B4FC" },      // Indigo clair
    { bg: "#FDE68A", border: "#FCD34D" },      // Jaune
    { bg: "#D9F99D", border: "#BEF264" },      // Vert lime
    { bg: "#FCA5A5", border: "#F87171" },      // Rouge clair
    { bg: "#DDD6FE", border: "#C4B5FD" },      // Violet clair
    { bg: "#A7F3D0", border: "#6EE7B7" },      // Vert menthe
  ];

  // Fonction pour obtenir la couleur d'un coiffeur
  const getStaffColor = (staffId: string) => {
    const index = hairdressers.findIndex((h) => h.id === staffId);
    return index >= 0 ? staffColors[index % staffColors.length] : { bg: "#E5E7EB", border: "#D1D5DB" };
  };

  // Charger les données initiales (staff, services, bookings)
  useEffect(() => {
    console.log("🚀 [Calendrier] Effect fetchData déclenché");
    console.log("🏢 [Calendrier] Salon sélectionné:", selectedSalon);
    console.log("⏳ [Calendrier] Chargement salon:", salonLoading);

    // Attendre que le salon soit chargé
    if (salonLoading) {
      console.log("⏳ [Calendrier] Chargement du salon en cours...");
      return;
    }

    if (!selectedSalon) {
      console.warn("⚠️ [Calendrier] Pas de salon sélectionné, chargement des données de démo...");
      // Charger directement les données de démo
      setHairdressers([
        { id: "1", title: "John Doe", avatar: "https://i.pravatar.cc/150?img=12" },
        { id: "2", title: "Maria Garcia", avatar: "https://i.pravatar.cc/150?img=45" },
        { id: "3", title: "Wendy Kim", avatar: "https://i.pravatar.cc/150?img=31" },
        { id: "4", title: "Amy Johnson", avatar: "https://i.pravatar.cc/150?img=23" },
        { id: "5", title: "Michael Brown", avatar: "https://i.pravatar.cc/150?img=33" },
        { id: "6", title: "Sarah Smith", avatar: "https://i.pravatar.cc/150?img=25" },
      ]);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      console.log("📡 [Calendrier] Début du chargement des données depuis l'API...");
      setLoading(true);
      setError(null);

      try {
        // Charger le personnel
        console.log("👥 [Calendrier] Chargement du personnel pour salon:", selectedSalon.name);
        const staffData = await getStaffBySalon(selectedSalon.id, true);
        console.log("✅ [Calendrier] Personnel chargé:", staffData);
        console.log("📊 [Calendrier] Nombre de membres du personnel:", staffData.length);

        const formattedStaff: HairdresserResource[] = staffData.map((staff: Staff) => ({
          id: staff.id,
          title: `${staff.firstName} ${staff.lastName}`,
          avatar: staff.avatar || `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`,
        }));
        console.log("💈 [Calendrier] Personnel formaté:", formattedStaff);
        setHairdressers(formattedStaff);

        // Charger les services
        console.log("🔧 [Calendrier] Chargement des services...");
        const servicesData = await getServicesBySalon(selectedSalon.id);
        console.log("✅ [Calendrier] Services chargés:", servicesData);
        setServices(servicesData);

        // Charger les horaires du salon
        console.log("⏰ [Calendrier] Chargement des horaires du salon...");
        const schedulesData = await getSchedulesBySalon(selectedSalon.id);
        console.log("✅ [Calendrier] Horaires chargés:", schedulesData);
        setSchedules(schedulesData);

        // Charger les réservations en passant la liste de staff
        console.log("📅 [Calendrier] Chargement des réservations...");
        await fetchBookings(formattedStaff);

        setLoading(false);
        console.log("✨ [Calendrier] Toutes les données ont été chargées avec succès!");
      } catch (err) {
        console.error("❌ [Calendrier] Erreur lors du chargement des données:", err);
        const error = err as Error;
        console.error("❌ [Calendrier] Détails de l'erreur:", error.message);
        console.error("❌ [Calendrier] Stack:", error.stack);

        setError("Impossible de charger les données du calendrier. Utilisation des données de démonstration.");
        setLoading(false);

        // Données de démonstration en cas d'erreur
        console.warn("⚠️ [Calendrier] Chargement des données de démonstration...");
        setHairdressers([
          { id: "1", title: "John Doe", avatar: "https://i.pravatar.cc/150?img=12" },
          { id: "2", title: "Maria Garcia", avatar: "https://i.pravatar.cc/150?img=45" },
          { id: "3", title: "Wendy Kim", avatar: "https://i.pravatar.cc/150?img=31" },
          { id: "4", title: "Amy Johnson", avatar: "https://i.pravatar.cc/150?img=23" },
          { id: "5", title: "Michael Brown", avatar: "https://i.pravatar.cc/150?img=33" },
          { id: "6", title: "Sarah Smith", avatar: "https://i.pravatar.cc/150?img=25" },
        ]);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSalon, salonLoading]);

  // Fonction pour charger les réservations
  const fetchBookings = async (staffList?: HairdresserResource[]) => {
    if (!selectedSalon) return;

    try {
      // Calculer la plage de dates (une semaine avant et après la date sélectionnée)
      const startDate = new Date(selectedDate);
      startDate.setDate(startDate.getDate() - 7);
      const endDate = new Date(selectedDate);
      endDate.setDate(endDate.getDate() + 7);

      const bookingsData = await getBookingsBySalon(selectedSalon.id, {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      console.log("📋 [Calendrier] Bookings reçus:", bookingsData);
      console.log("📋 [Calendrier] Premier booking:", bookingsData[0]);

      setBookings(bookingsData);

      // Utiliser la liste de staff passée en paramètre ou celle de l'état
      const activeStaffList = staffList || hairdressers;

      // Convertir les bookings en événements du calendrier
      const calendarEvents: CalendarEvent[] = [];

      bookingsData.forEach((booking: Booking) => {
        // Construire le nom du client à partir de la relation client
        const clientName = booking.client
          ? `${booking.client.firstName} ${booking.client.lastName}`.trim()
          : booking.clientName || "Sans nom";

        console.log("👤 [Calendrier] Client name pour booking", booking.id, ":", clientName);
        console.log("🔍 [Calendrier] isMultiService:", booking.isMultiService, "bookingServices:", booking.bookingServices?.length);

        // Si c'est une réservation multi-services, créer un événement par BookingService
        if (booking.isMultiService && booking.bookingServices && booking.bookingServices.length > 0) {
          booking.bookingServices.forEach((bookingService, index) => {
            const serviceName = bookingService.service?.name || "Service";
            const staffIndex = activeStaffList.findIndex((h) => h.id === bookingService.staffId);
            const colors = staffIndex >= 0 ? staffColors[staffIndex % staffColors.length] : { bg: "#E5E7EB", border: "#D1D5DB" };

            console.log(`📌 [Calendrier] Événement multi-service ${index + 1}/${booking.bookingServices!.length}:`, {
              bookingServiceId: bookingService.id,
              staffId: bookingService.staffId,
              serviceName,
              startTime: bookingService.startTime,
              endTime: bookingService.endTime
            });

            calendarEvents.push({
              id: `${booking.id}-${bookingService.id}`,
              resourceId: bookingService.staffId,
              title: `${clientName} (${index + 1}/${booking.bookingServices!.length})`,
              start: bookingService.startTime,
              end: bookingService.endTime,
              backgroundColor: colors.bg,
              borderColor: colors.border,
              extendedProps: {
                service: serviceName,
                serviceId: bookingService.serviceId,
                resourceId: bookingService.staffId,
                bookingId: booking.id,
                bookingServiceId: bookingService.id,
                status: booking.status,
                clientEmail: booking.client?.email || booking.clientEmail,
                clientPhone: booking.client?.phone || booking.clientPhone,
                notes: booking.notes,
                isMultiService: true,
                serviceOrder: index + 1,
                totalServices: booking.bookingServices!.length
              },
            });
          });
        } else {
          // Réservation simple
          const serviceName = booking.service?.name || "Service";
          const staffIndex = activeStaffList.findIndex((h) => h.id === booking.staffId);
          const colors = staffIndex >= 0 ? staffColors[staffIndex % staffColors.length] : { bg: "#E5E7EB", border: "#D1D5DB" };

          console.log("📌 [Calendrier] Événement simple:", {
            bookingId: booking.id,
            staffId: booking.staffId,
            serviceName,
            startTime: booking.startTime,
            endTime: booking.endTime
          });

          calendarEvents.push({
            id: booking.id,
            resourceId: booking.staffId || '',
            title: clientName,
            start: booking.startTime,
            end: booking.endTime,
            backgroundColor: colors.bg,
            borderColor: colors.border,
            extendedProps: {
              service: serviceName,
              serviceId: booking.serviceId,
              resourceId: booking.staffId,
              bookingId: booking.id,
              status: booking.status,
              clientEmail: booking.client?.email || booking.clientEmail,
              clientPhone: booking.client?.phone || booking.clientPhone,
              notes: booking.notes,
            },
          });
        }
      });

      console.log(`✅ [Calendrier] Total événements créés: ${calendarEvents.length}`);
      setEvents(calendarEvents);
    } catch (err) {
      console.error("Erreur lors du chargement des réservations:", err);
    }
  };

  // Recharger les réservations quand la date change
  useEffect(() => {
    if (selectedSalon && hairdressers.length > 0) {
      fetchBookings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, selectedSalon]);

  // Données de démonstration pour le premier chargement
  useEffect(() => {
    // Initialiser avec quelques événements de test si pas de salon sélectionné
    if (selectedSalon) return;

    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;

    // Événements pour aujourd'hui
    const todayEvents: CalendarEvent[] = [
      {
        id: "1",
        resourceId: "1",
        title: "Brenda Massey",
        start: `${dateStr}T08:00:00`,
        end: `${dateStr}T09:00:00`,
        backgroundColor: staffColors[0].bg,
        borderColor: staffColors[0].border,
        extendedProps: { service: "Blow Dry" },
      },
      {
        id: "2",
        resourceId: "2",
        title: "Alena Geidt",
        start: `${dateStr}T08:00:00`,
        end: `${dateStr}T09:00:00`,
        backgroundColor: staffColors[1].bg,
        borderColor: staffColors[1].border,
        extendedProps: { service: "Hair cut" },
      },
      {
        id: "3",
        resourceId: "3",
        title: "Phillip Dorwart",
        start: `${dateStr}T09:00:00`,
        end: `${dateStr}T10:15:00`,
        backgroundColor: staffColors[2].bg,
        borderColor: staffColors[2].border,
        extendedProps: { service: "Beard Grooming" },
      },
      {
        id: "4",
        resourceId: "4",
        title: "James Herwitz",
        start: `${dateStr}T08:30:00`,
        end: `${dateStr}T09:45:00`,
        backgroundColor: staffColors[3].bg,
        borderColor: staffColors[3].border,
        extendedProps: { service: "Balinese Massage" },
      },
      {
        id: "5",
        resourceId: "5",
        title: "Megan White",
        start: `${dateStr}T09:00:00`,
        end: `${dateStr}T10:15:00`,
        backgroundColor: staffColors[4].bg,
        borderColor: staffColors[4].border,
        extendedProps: { service: "Hair cut" },
      },
      {
        id: "6",
        resourceId: "6",
        title: "Tony Danza",
        start: `${dateStr}T08:30:00`,
        end: `${dateStr}T09:45:00`,
        backgroundColor: staffColors[5].bg,
        borderColor: staffColors[5].border,
        extendedProps: { service: "Balinese Massage" },
      },
      {
        id: "7",
        resourceId: "1",
        title: "Craig Mango",
        start: `${dateStr}T10:00:00`,
        end: `${dateStr}T10:35:00`,
        backgroundColor: staffColors[0].bg,
        borderColor: staffColors[0].border,
        extendedProps: { service: "Yoga session" },
      },
      {
        id: "8",
        resourceId: "1",
        title: "Zain Dias",
        start: `${dateStr}T11:00:00`,
        end: `${dateStr}T12:00:00`,
        backgroundColor: staffColors[0].bg,
        borderColor: staffColors[0].border,
        extendedProps: { service: "Hair Coloring" },
      },
      {
        id: "9",
        resourceId: "2",
        title: "Marilyn Carder",
        start: `${dateStr}T10:00:00`,
        end: `${dateStr}T10:35:00`,
        backgroundColor: staffColors[1].bg,
        borderColor: staffColors[1].border,
        extendedProps: { service: "Hair and Beard Cut" },
      },
      {
        id: "10",
        resourceId: "4",
        title: "Amy Jones",
        start: `${dateStr}T09:45:00`,
        end: `${dateStr}T11:15:00`,
        backgroundColor: staffColors[3].bg,
        borderColor: staffColors[3].border,
        extendedProps: { service: "Haircut and colour" },
      },
      {
        id: "11",
        resourceId: "6",
        title: "Laura Marsden",
        start: `${dateStr}T09:45:00`,
        end: `${dateStr}T11:15:00`,
        backgroundColor: staffColors[5].bg,
        borderColor: staffColors[5].border,
        extendedProps: { service: "Haircut and colour" },
      },
      {
        id: "12",
        resourceId: "5",
        title: "Randy Press",
        start: `${dateStr}T11:15:00`,
        end: `${dateStr}T12:30:00`,
        backgroundColor: staffColors[4].bg,
        borderColor: staffColors[4].border,
        extendedProps: { service: "Swedish Massage" },
      },
      {
        id: "13",
        resourceId: "3",
        title: "Desirae Stanton",
        start: `${dateStr}T12:15:00`,
        end: `${dateStr}T13:30:00`,
        backgroundColor: staffColors[2].bg,
        borderColor: staffColors[2].border,
        extendedProps: { service: "Blow Dry" },
      },
      {
        id: "14",
        resourceId: "4",
        title: "Alena Dias",
        start: `${dateStr}T12:15:00`,
        end: `${dateStr}T13:30:00`,
        backgroundColor: staffColors[3].bg,
        borderColor: staffColors[3].border,
        extendedProps: { service: "Haircut and colour" },
      },
      {
        id: "15",
        resourceId: "6",
        title: "Dori Doreau",
        start: `${dateStr}T12:15:00`,
        end: `${dateStr}T13:30:00`,
        backgroundColor: staffColors[5].bg,
        borderColor: staffColors[5].border,
        extendedProps: { service: "Haircut and colour" },
      },
      {
        id: "16",
        resourceId: "1",
        title: "Mary Lee Fisher",
        start: `${dateStr}T13:15:00`,
        end: `${dateStr}T14:30:00`,
        backgroundColor: staffColors[0].bg,
        borderColor: staffColors[0].border,
        extendedProps: { service: "Hair Coloring" },
      },
    ];

    // Ajouter quelques événements pour la semaine
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;

    const weekEvents: CalendarEvent[] = [
      {
        id: "17",
        resourceId: "1",
        title: "Sophie Martin",
        start: `${tomorrowStr}T09:00:00`,
        end: `${tomorrowStr}T10:00:00`,
        backgroundColor: staffColors[0].bg,
        borderColor: staffColors[0].border,
        extendedProps: { service: "Hair cut" },
      },
      {
        id: "18",
        resourceId: "2",
        title: "Lucas Dubois",
        start: `${tomorrowStr}T14:00:00`,
        end: `${tomorrowStr}T15:30:00`,
        backgroundColor: staffColors[1].bg,
        borderColor: staffColors[1].border,
        extendedProps: { service: "Haircut and colour" },
      },
    ];

    setEvents([...todayEvents, ...weekEvents]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mettre à jour le calendrier FullCalendar quand la date change
  useEffect(() => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.gotoDate(selectedDate);
    }
  }, [selectedDate]);

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    if (isCalendarReadOnly) return; // Désactiver la sélection en mode lecture seule
    resetModalFields();
    setEventStartDate(selectInfo.startStr);
    setEventEndDate(selectInfo.endStr || selectInfo.startStr);
    if (viewMode === "single") {
      setSelectedResource(selectedResource);
    }
    openModal();
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    if (isCalendarReadOnly) return; // Désactiver les clics sur les événements en mode lecture seule
    const event = clickInfo.event;
    setSelectedEvent(event as unknown as CalendarEvent);
    setEventTitle(event.title);
    setEventStartDate(event.start?.toISOString() || "");
    setEventEndDate(event.end?.toISOString() || "");
    setEventService(event.extendedProps.serviceId || ""); // Utiliser serviceId au lieu de service
    setSelectedResource(event.extendedProps.resourceId || selectedResource);
    openModal();
  };


  // Fonction pour normaliser le format de date
  const normalizeDateTimeFormat = (dateStr: string): string => {
    // Si la date est déjà au format ISO complet, la retourner telle quelle
    if (dateStr.includes('Z') || dateStr.match(/[+-]\d{2}:\d{2}$/)) {
      return dateStr;
    }

    // Si la date est au format datetime-local (YYYY-MM-DDTHH:mm), ajouter les secondes
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
      return `${dateStr}:00`;
    }

    // Sinon, retourner la date telle quelle
    return dateStr;
  };

  const handleAddOrUpdateEvent = async () => {
    if (!eventTitle || !selectedResource || !eventStartDate || !eventEndDate) {
      alert("Veuillez remplir tous les champs requis");
      return;
    }

    setLoading(true);

    try {
      const colors = getStaffColor(selectedResource);

      // Normaliser les dates
      const normalizedStartTime = normalizeDateTimeFormat(eventStartDate);
      const normalizedEndTime = normalizeDateTimeFormat(eventEndDate);

      if (selectedEvent && selectedEvent.extendedProps?.bookingId) {
        // Mettre à jour l'événement existant via l'API
        console.log('🔄 [Calendrier] Mise à jour du booking:', {
          bookingId: selectedEvent.extendedProps.bookingId,
          staffId: selectedResource,
          serviceId: eventService || undefined,
          startTime: normalizedStartTime,
          endTime: normalizedEndTime,
        });

        await updateBooking(selectedEvent.extendedProps.bookingId, {
          staffId: selectedResource,
          serviceId: eventService || undefined,
          startTime: normalizedStartTime,
          endTime: normalizedEndTime,
        });

        // Mettre à jour l'état local
        setEvents((prevEvents) =>
          prevEvents.map((event) =>
            event.id === selectedEvent.id
              ? {
                ...event,
                title: eventTitle,
                start: normalizedStartTime,
                end: normalizedEndTime,
                resourceId: selectedResource,
                backgroundColor: colors.bg,
                borderColor: colors.border,
                extendedProps: {
                  service: eventService,
                  serviceId: eventService,
                  resourceId: selectedResource,
                  bookingId: selectedEvent.extendedProps.bookingId,
                },
              }
              : event
          )
        );
      } else {
        // Créer un nouveau rendez-vous via l'API
        if (!selectedSalon) {
          alert("Salon non identifié");
          return;
        }

        console.log('➕ [Calendrier] Création du booking:', {
          salonId: selectedSalon.id,
          staffId: selectedResource,
          serviceId: eventService || "default-service-id",
          clientName: eventTitle,
          startTime: normalizedStartTime,
          endTime: normalizedEndTime,
        });

        const newBooking = await createBooking({
          salonId: selectedSalon.id,
          staffId: selectedResource,
          serviceId: eventService || "default-service-id", // Vous devrez peut-être ajuster cela
          clientName: eventTitle,
          startTime: normalizedStartTime,
          endTime: normalizedEndTime,
          status: "CONFIRMED",
        });

        // Ajouter le nouvel événement à l'état local
        const newEvent: CalendarEvent = {
          id: newBooking.id,
          resourceId: selectedResource,
          title: eventTitle,
          start: normalizedStartTime,
          end: normalizedEndTime,
          backgroundColor: colors.bg,
          borderColor: colors.border,
          extendedProps: {
            service: eventService,
            serviceId: eventService,
            resourceId: selectedResource,
            bookingId: newBooking.id,
          },
        };
        setEvents((prevEvents) => [...prevEvents, newEvent]);
      }

      // Rafraîchir les données depuis le serveur
      await fetchBookings();

      closeModal();
      resetModalFields();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du rendez-vous:", error);
      alert("Erreur lors de la sauvegarde du rendez-vous. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const resetModalFields = () => {
    setEventTitle("");
    setEventStartDate("");
    setEventEndDate("");
    setEventService("");
    if (viewMode === "all") {
      setSelectedResource("");
    }
    setSelectedEvent(null);
    setSelectedBookingDate('');
    setSelectedTimeSlot('');
    setAvailableTimeSlots([]);
    setSelectedClient(null);
  };

  // Fonction pour vérifier si un intervalle complet est disponible
  const isIntervalAvailable = (
    staffId: string,
    startDateTime: string,
    endDateTime: string,
    excludeEventId?: string
  ): boolean => {
    if (!staffId || !startDateTime || !endDateTime) return false;

    const proposedStart = new Date(startDateTime);
    const proposedEnd = new Date(endDateTime);

    // Vérifier si les dates sont valides
    if (isNaN(proposedStart.getTime()) || isNaN(proposedEnd.getTime())) return false;

    // Récupérer tous les événements du coiffeur
    const staffEvents = events.filter(
      (event) => event.resourceId === staffId && event.id !== excludeEventId
    );

    // Vérifier qu'aucun événement ne chevauche l'intervalle proposé
    for (const event of staffEvents) {
      const existingStart = new Date(event.start);
      const existingEnd = new Date(event.end);

      // Détection de chevauchement : proposedStart < existingEnd ET proposedEnd > existingStart
      if (proposedStart < existingEnd && proposedEnd > existingStart) {
        return false; // Conflit détecté
      }
    }

    return true; // Aucun conflit
  };

  // Fonction pour générer tous les créneaux horaires avec leur disponibilité
  const generateAvailableTimeSlots = (
    date: string,
    staffId: string,
    serviceDuration: number,
    excludeEventId?: string
  ): Array<{ time: string; available: boolean }> => {
    const slots: Array<{ time: string; available: boolean }> = [];

    // Récupérer le jour de la semaine (0 = Dimanche, 1 = Lundi, ...)
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay();

    // Trouver le schedule pour ce jour de la semaine
    const daySchedule = schedules.find(s => s.dayOfWeek === dayOfWeek);

    // Si pas d'horaire défini ou salon fermé ce jour-là, retourner un tableau vide
    if (!daySchedule || daySchedule.isClosed || !daySchedule.timeSlots || daySchedule.timeSlots.length === 0) {
      console.log(`⚠️ [TimeSlots] Salon fermé le ${['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'][dayOfWeek]}`);
      return [];
    }

    // Fonction helper pour convertir "HH:mm" en minutes depuis minuit
    const timeToMinutes = (time: string): number => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    // Fonction helper pour convertir les minutes en "HH:mm"
    const minutesToTime = (minutes: number): string => {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    };

    // Pour chaque plage horaire du salon (ex: 10h-12h, 14h-18h)
    for (const timeSlot of daySchedule.timeSlots) {
      const startMinutes = timeToMinutes(timeSlot.startTime);
      const endMinutes = timeToMinutes(timeSlot.endTime);

      // Générer les créneaux dans cette plage avec un pas de 20 minutes
      for (let currentMinutes = startMinutes; currentMinutes < endMinutes; currentMinutes += 20) {
        const slotEndMinutes = currentMinutes + serviceDuration;

        // Vérifier que le service se termine avant la fin de la plage horaire
        if (slotEndMinutes > endMinutes) {
          break; // Pas assez de temps pour ce service dans cette plage
        }

        const timeString = minutesToTime(currentMinutes);

        // Calculer l'heure de début et de fin pour ce créneau
        const startDateTime = `${date}T${timeString}:00`;
        const startDate = new Date(startDateTime);
        const endDate = new Date(startDate.getTime() + serviceDuration * 60000);
        const endDateTime = endDate.toISOString();

        // Vérifier si tout l'intervalle est disponible
        const available = isIntervalAvailable(staffId, startDateTime, endDateTime, excludeEventId);

        slots.push({
          time: timeString,
          available
        });
      }
    }

    console.log(`✅ [TimeSlots] ${slots.length} créneaux générés pour ${['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'][dayOfWeek]}`);
    return slots;
  };

  // Fonction pour gérer la sélection d'un créneau horaire
  const handleTimeSlotClick = (timeSlot: string) => {
    if (!selectedBookingDate || !eventService) return;

    setSelectedTimeSlot(timeSlot);

    // Calculer l'heure de début
    const startDateTime = `${selectedBookingDate}T${timeSlot}:00`;

    // Calculer l'heure de fin en fonction de la durée du service
    const selectedServiceObj = services.find(s => s.id === eventService);
    const serviceDuration = selectedServiceObj?.duration || 60;

    const startDate = new Date(startDateTime);
    const endDate = new Date(startDate.getTime() + serviceDuration * 60000);

    // Mettre à jour les états
    setEventStartDate(startDate.toISOString());
    setEventEndDate(endDate.toISOString());
  };

  // Effet pour régénérer les créneaux quand la date, le coiffeur ou le service changent
  useEffect(() => {
    if (selectedBookingDate && selectedResource && eventService) {
      // Trouver la durée du service sélectionné
      const selectedServiceObj = services.find(s => s.id === eventService);
      const serviceDuration = selectedServiceObj?.duration || 60;

      // Générer les créneaux disponibles
      const slots = generateAvailableTimeSlots(
        selectedBookingDate,
        selectedResource,
        serviceDuration,
        selectedEvent?.id
      );

      setAvailableTimeSlots(slots);
    } else {
      setAvailableTimeSlots([]);
      setSelectedTimeSlot('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBookingDate, selectedResource, eventService, events]);

  // Effet pour initialiser les champs lors de la modification d'un événement
  useEffect(() => {
    if (selectedEvent && eventStartDate) {
      const startDate = new Date(eventStartDate);
      const dateStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
      const timeStr = `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`;

      setSelectedBookingDate(dateStr);
      setSelectedTimeSlot(timeStr);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEvent, isOpen]);

  // Gérer le clic sur une cellule vide pour créer un rendez-vous
  const handleCellClick = (hairdresserId: string, hourIndex: number) => {
    if (isCalendarReadOnly) return; // Désactiver la création de RDV en mode lecture seule
    const hour = hourIndex + CALENDAR_START_HOUR; // Les heures commencent à 8h
    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
    const startDateTime = `${dateStr}T${String(hour).padStart(2, "0")}:00:00`;
    const endDateTime = `${dateStr}T${String(hour + 1).padStart(2, "0")}:00:00`;

    resetModalFields();
    setSelectedResource(hairdresserId);
    setEventStartDate(startDateTime);
    setEventEndDate(endDateTime);
    openModal();
  };

  // Filtrer les événements pour la vue actuelle
  const getFilteredEvents = () => {
    if (viewMode === "single") {
      return events.filter((e) => e.resourceId === selectedResource);
    }
    return events;
  };

  // Filtrer les événements pour la date sélectionnée (pour la vue grille jour)
  const getEventsForSelectedDate = () => {
    return events.filter((e) => {
      const eventDate = new Date(e.start as string);
      if (Number.isNaN(eventDate.getTime())) return false;
      return (
        eventDate.getFullYear() === selectedDate.getFullYear() &&
        eventDate.getMonth() === selectedDate.getMonth() &&
        eventDate.getDate() === selectedDate.getDate()
      );
    });
  };

  // Obtenir les dates de la semaine (Lundi à Dimanche)
  const getWeekDates = () => {
    const dates = [];
    const current = new Date(selectedDate);
    const day = current.getDay();
    const diff = current.getDate() - day + (day === 0 ? -6 : 1); // Ajuster pour commencer le lundi
    const monday = new Date(current.setDate(diff));

    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  // Filtrer les événements pour une date spécifique
  const getEventsForDate = (date: Date) => {
    return events.filter((e) => {
      const eventDate = new Date(e.start as string);
      if (Number.isNaN(eventDate.getTime())) return false;
      return (
        eventDate.getFullYear() === date.getFullYear() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getDate() === date.getDate()
      );
    });
  };

  // Navigation de date
  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  // Fonction pour rafraîchir les données avec animation
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchBookings();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Fonction pour supprimer un rendez-vous
  const handleDeleteEvent = async () => {
    if (!selectedEvent?.extendedProps?.bookingId) {
      alert("Impossible de supprimer ce rendez-vous");
      return;
    }

    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce rendez-vous ?")) {
      return;
    }

    setLoading(true);

    try {
      await deleteBooking(selectedEvent.extendedProps.bookingId);

      // Supprimer de l'état local
      setEvents((prevEvents) =>
        prevEvents.filter((event) => event.id !== selectedEvent.id)
      );

      // Rafraîchir depuis le serveur
      await fetchBookings();

      closeModal();
      resetModalFields();
    } catch (error) {
      console.error("Erreur lors de la suppression du rendez-vous:", error);
      alert("Erreur lors de la suppression du rendez-vous. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour gérer le déplacement d'un événement (drag and drop)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEventDrop = async (info: any) => {
    const event = info.event;
    const bookingId = event.extendedProps?.bookingId;

    if (!bookingId) {
      console.error("Pas de bookingId trouvé pour cet événement");
      info.revert(); // Annuler le déplacement
      return;
    }

    try {
      const newStartTime = event.start?.toISOString() || "";
      const newEndTime = event.end?.toISOString() || "";

      console.log('🔄 [Calendrier] Déplacement du booking par drag and drop:', {
        bookingId,
        startTime: newStartTime,
        endTime: newEndTime,
      });

      // Mettre à jour via l'API
      await updateBooking(bookingId, {
        startTime: newStartTime,
        endTime: newEndTime,
      });

      // Rafraîchir les données depuis le serveur
      await fetchBookings();

      console.log('✅ [Calendrier] Booking déplacé avec succès');
    } catch (error) {
      console.error("Erreur lors du déplacement du rendez-vous:", error);
      alert("Erreur lors du déplacement du rendez-vous. Les modifications ont été annulées.");
      info.revert(); // Annuler le déplacement en cas d'erreur
    }
  };

  // Fonction pour gérer le redimensionnement d'un événement
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEventResize = async (info: any) => {
    const event = info.event;
    const bookingId = event.extendedProps?.bookingId;

    if (!bookingId) {
      console.error("Pas de bookingId trouvé pour cet événement");
      info.revert(); // Annuler le redimensionnement
      return;
    }

    try {
      const newStartTime = event.start?.toISOString() || "";
      const newEndTime = event.end?.toISOString() || "";

      console.log('🔄 [Calendrier] Redimensionnement du booking:', {
        bookingId,
        startTime: newStartTime,
        endTime: newEndTime,
      });

      // Mettre à jour via l'API
      await updateBooking(bookingId, {
        startTime: newStartTime,
        endTime: newEndTime,
      });

      // Rafraîchir les données depuis le serveur
      await fetchBookings();

      console.log('✅ [Calendrier] Booking redimensionné avec succès');
    } catch (error) {
      console.error("Erreur lors du redimensionnement du rendez-vous:", error);
      alert("Erreur lors du redimensionnement du rendez-vous. Les modifications ont été annulées.");
      info.revert(); // Annuler le redimensionnement en cas d'erreur
    }
  };

  // Obtenir le format de la date affichée (ex: "Wednesday 21 Jun")
  const getFormattedDate = () => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'short'
    };
    return selectedDate.toLocaleDateString('fr-FR', options);
  };

  // Obtenir la vue FullCalendar appropriée
  const getFullCalendarView = () => {
    if (timeView === "day") return "timeGridDay";
    if (timeView === "week") return "timeGridWeek";
    return "dayGridMonth";
  };

  // Déterminer si on doit utiliser FullCalendar ou la grille personnalisée
  // La grille personnalisée est utilisée pour "jour" et "semaine" en mode "all"
  const useFullCalendar = viewMode === "single" || timeView === "month";

  const isSunday = (date: Date) => date.getDay() === 0;

  const isLunchHour = (hour: number) =>
    hour >= LUNCH_START_HOUR && hour < LUNCH_END_HOUR;

  const isBlockedCustomSlot = (date: Date, slotIndex: number) => {
    const hour = CALENDAR_START_HOUR + slotIndex;
    return isSunday(date) || isLunchHour(hour);
  };

  const isBlockedDateRange = (start: Date, end: Date) => {
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (isSunday(startDate)) {
      return true;
    }

    // Selection all-day (month view): only block Sundays.
    if (startDate.getHours() === 0 && endDate.getHours() === 0) {
      for (
        const cursor = new Date(startDate);
        cursor < endDate;
        cursor.setDate(cursor.getDate() + 1)
      ) {
        if (isSunday(cursor)) {
          return true;
        }
      }
      return false;
    }

    const lunchStart = new Date(startDate);
    lunchStart.setHours(LUNCH_START_HOUR, 0, 0, 0);
    const lunchEnd = new Date(startDate);
    lunchEnd.setHours(LUNCH_END_HOUR, 0, 0, 0);

    return startDate < lunchEnd && endDate > lunchStart;
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Indicateur de chargement */}
      {loading && (
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center gap-3">
          <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-sm text-blue-800 dark:text-blue-200">Chargement des données...</span>
        </div>
      )}

      {/* Indicateur d'erreur */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-red-800 dark:text-red-200">{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {/* Barre de navigation moderne */}
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        {/* Section gauche: Navigation de date */}
        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 font-medium text-sm text-gray-700 dark:text-gray-300"
          >
            Aujourd'hui
          </button>

          <div className="flex items-center border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden">
            <button
              onClick={goToPreviousDay}
              className="p-2 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 border-r border-gray-300 dark:border-gray-700"
            >
              <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goToNextDay}
              className="p-2 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700"
            >
              <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="text-gray-900 dark:text-white font-medium text-sm capitalize">
            {getFormattedDate()}
          </div>
        </div>

        {/* Section centre: Sélection salon et équipe */}
        <div className="flex items-center gap-2">


          <div className="relative">
            <select
              value={viewMode === "all" ? "all" : selectedResource}
              onChange={(e) => {
                if (e.target.value === "all") {
                  setViewMode("all");
                } else {
                  setViewMode("single");
                  setSelectedResource(e.target.value);
                }
              }}
              className="pl-4 pr-10 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white text-sm font-medium appearance-none cursor-pointer"
            >
              <option value="all">Toute l'équipe</option>
              {hairdressers.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.title}
                </option>
              ))}
            </select>
            <svg
              className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          <button
            className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
            title="Filtrer"
          >
            <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
            </svg>
          </button>
        </div>

        {/* Section droite: Actions */}
        <div className="flex items-center gap-2">
          <button
            className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
            title="Paramètres"
          >
            <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>

          <button
            className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
            title="Calendrier"
          >
            <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 transition-transform ${isRefreshing ? "animate-spin" : ""
              }`}
            title="Actualiser"
          >
            <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          <div className="relative">
            <select
              value={timeView}
              onChange={(e) => setTimeView(e.target.value as TimeView)}
              className="pl-4 pr-10 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white text-sm font-medium appearance-none cursor-pointer"
            >
              <option value="day">Jour</option>
              <option value="week">Semaine</option>
              <option value="month">Mois</option>
            </select>
            <svg
              className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {/* Bouton Add - masqué en mode lecture seule */}
          {!isCalendarReadOnly && (
            <div className="relative">
              <button
                onClick={openModal}
                className="pl-4 pr-10 py-2 rounded-lg bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium"
              >
                Add
              </button>
              <svg
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white dark:text-gray-900 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Vue Tous les coiffeurs en mode Jour/Semaine - Grille personnalisée */}
      {!useFullCalendar && timeView === "day" && (
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3 overflow-x-auto">
          <div className="min-w-[1200px]">
            {/* En-tête avec les profils des coiffeurs pour la vue jour */}
            <div className="grid grid-cols-[80px_repeat(6,1fr)] border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <div className="border-r border-gray-200 dark:border-gray-700 flex items-center justify-center">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Heures</span>
              </div>
              {hairdressers.map((hairdresser) => (
                <div
                  key={hairdresser.id}
                  className="p-4 flex flex-col items-center justify-center border-r border-gray-200 dark:border-gray-700 last:border-r-0"
                >
                  <Avatar src={hairdresser.avatar} alt={hairdresser.title} size="large" />
                  <p className="mt-2 text-sm font-medium text-gray-900 dark:text-white truncate">
                    {hairdresser.title}
                  </p>
                </div>
              ))}
            </div>

            {/* Grille horaire */}
            <div className="relative">
              <div className="grid grid-cols-[80px_repeat(6,1fr)]">
                {/* Colonne des heures */}
                <div className="bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
                  {Array.from({ length: CALENDAR_VISIBLE_HOURS }, (_, i) => i + CALENDAR_START_HOUR).map((hour) => (
                    <div
                      key={hour}
                      className="h-32 px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700"
                    >
                      {hour}:00
                    </div>
                  ))}
                </div>

                {/* Colonnes des coiffeurs */}
                {hairdressers.map((hairdresser) => (
                  <div
                    key={hairdresser.id}
                    className="relative border-r border-gray-200 dark:border-gray-700 last:border-r-0"
                  >
                    {/* Lignes de séparation des heures - Cliquables et Drop zones */}
                    {Array.from({ length: CALENDAR_VISIBLE_HOURS }).map((_, index) => {
                      const isBlockedSlot = isBlockedCustomSlot(selectedDate, index);

                      return (
                        <div
                          key={index}
                          onClick={() => {
                            if (isDragging || isBlockedSlot) return;
                            handleCellClick(hairdresser.id, index);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (isBlockedSlot) return;
                            handleDrop(hairdresser.id, index);
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                          }}
                          onDragEnter={(e) => {
                            e.preventDefault();
                            if (isBlockedSlot) return;
                            e.currentTarget.classList.add('bg-blue-50', 'dark:bg-blue-900/20');
                          }}
                          onDragLeave={(e) => {
                            if (isBlockedSlot) return;
                            e.currentTarget.classList.remove('bg-blue-50', 'dark:bg-blue-900/20');
                          }}
                          className={`h-32 border-b border-gray-200 dark:border-gray-700 calendar-grid-cell transition-all duration-200 ease-in-out relative ${isBlockedSlot ? "calendar-cell-blocked cursor-not-allowed" : "cursor-pointer group"}`}
                        >
                          {!isBlockedSlot && (
                            <>
                              <div className="absolute inset-0 bg-blue-500 opacity-0 group-hover:opacity-5 transition-opacity duration-200"></div>
                              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}

                    {/* Rendez-vous pour ce coiffeur */}
                    <div className="absolute top-0 left-0 right-0">
                      {getEventsForSelectedDate()
                        .filter((apt) => apt.resourceId === hairdresser.id)
                        .map((appointment) => {
                          const startTime = new Date(appointment.start);
                          const endTime = new Date(appointment.end);
                          const startHour = startTime.getHours();
                          const startMinute = startTime.getMinutes();
                          const endHour = endTime.getHours();
                          const endMinute = endTime.getMinutes();

                          const startMinutes = (startHour - CALENDAR_START_HOUR) * 60 + startMinute;
                          const duration = (endHour - startHour) * 60 + (endMinute - startMinute);

                          const pixelPerMinute = 128 / 60;
                          const top = startMinutes * pixelPerMinute;
                          const height = duration * pixelPerMinute;

                          return (
                            <div
                              key={appointment.id}
                              draggable={!isCalendarReadOnly}
                              onDragStart={(e) => {
                                if (isCalendarReadOnly) return;
                                e.stopPropagation();
                                handleDragStart(appointment);
                              }}
                              onDragEnd={handleDragEnd}
                              onClick={(e) => {
                                if (isCalendarReadOnly || isDragging) return;
                                e.stopPropagation();
                                const event = {
                                  ...appointment,
                                  extendedProps: {
                                    ...appointment.extendedProps,
                                    resourceId: appointment.resourceId,
                                  },
                                };
                                setSelectedEvent(event);
                                setEventTitle(appointment.title);
                                setEventStartDate(appointment.start);
                                setEventEndDate(appointment.end);
                                setEventService(appointment.extendedProps?.serviceId || ""); // Utiliser serviceId
                                setSelectedResource(appointment.resourceId);
                                openModal();
                              }}
                              className={`absolute left-1 right-1 rounded-lg p-3 shadow-sm border-2 cursor-move hover:shadow-lg hover:scale-[1.02] hover:-translate-y-0.5 transition-all duration-200 ease-in-out animate-fade-in overflow-hidden ${isDragging && draggedEvent?.id === appointment.id ? 'opacity-50' : ''
                                }`}
                              style={{
                                top: `${top}px`,
                                height: `${Math.max(height, 70)}px`,
                                backgroundColor: appointment.backgroundColor,
                                borderColor: appointment.borderColor,
                              }}
                            >
                              <div className="flex flex-col h-full justify-start">
                                <div className="text-xs font-semibold text-gray-800 mb-0.5 truncate">
                                  {startHour}:{String(startMinute).padStart(2, "0")} - {endHour}:{String(endMinute).padStart(2, "0")}
                                </div>
                                <div className="text-sm font-bold text-gray-900 truncate leading-tight">
                                  {appointment.title || "Sans nom"}
                                </div>
                                {appointment.extendedProps?.service && (
                                  <div className="text-xs text-gray-700 mt-0.5 truncate leading-tight">
                                    {appointment.extendedProps.service}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vue semaine avec avatars des coiffeurs */}
      {!useFullCalendar && timeView === "week" && (
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3 overflow-x-auto">
          <div className="min-w-[1400px]">
            {/* En-tête avec les jours de la semaine */}
            <div className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <div className="border-r border-gray-200 dark:border-gray-700 flex items-center justify-center">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Heures</span>
              </div>
              {getWeekDates().map((date, index) => {
                const isToday = date.toDateString() === new Date().toDateString();
                const isSundayColumn = isSunday(date);
                return (
                  <div
                    key={index}
                    className={`p-3 border-r border-gray-200 dark:border-gray-700 last:border-r-0 ${isToday ? 'bg-brand-50 dark:bg-brand-900/20' : ''
                      } ${isSundayColumn ? 'calendar-weekday-blocked' : ''}`}
                  >
                    <div className="text-center">
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                        {date.toLocaleDateString('fr-FR', { weekday: 'short' })}
                      </div>
                      <div className={`text-lg font-bold ${isToday ? 'text-brand-600 dark:text-brand-400' : 'text-gray-900 dark:text-white'}`}>
                        {date.getDate()}
                      </div>
                      {/* Mini avatars des coiffeurs */}
                      <div className="flex items-center justify-center gap-1 mt-2 flex-wrap">
                        {hairdressers.slice(0, 4).map((hairdresser) => (
                          <img
                            key={hairdresser.id}
                            src={hairdresser.avatar}
                            alt={hairdresser.title}
                            className="w-6 h-6 rounded-full object-cover border-2 border-white dark:border-gray-800"
                            title={hairdresser.title}
                          />
                        ))}
                        {hairdressers.length > 4 && (
                          <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[10px] font-medium text-gray-600 dark:text-gray-300">
                            +{hairdressers.length - 4}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Grille horaire semaine */}
            <div className="relative">
              <div className="grid grid-cols-[80px_repeat(7,1fr)]">
                {/* Colonne des heures */}
                <div className="bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
                  {Array.from({ length: CALENDAR_VISIBLE_HOURS }, (_, i) => i + CALENDAR_START_HOUR).map((hour) => (
                    <div
                      key={hour}
                      className="h-24 px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700"
                    >
                      {hour}:00
                    </div>
                  ))}
                </div>

                {/* Colonnes des jours */}
                {getWeekDates().map((date, dayIndex) => {
                  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
                  const dayEvents = getEventsForDate(date);
                  const isToday = date.toDateString() === new Date().toDateString();
                  const isSundayColumn = isSunday(date);

                  return (
                    <div
                      key={dayIndex}
                      className={`relative border-r border-gray-200 dark:border-gray-700 last:border-r-0 ${isToday ? 'bg-brand-50/30 dark:bg-brand-900/10' : ''
                        } ${isSundayColumn ? 'calendar-weekday-blocked' : ''}`}
                    >
                      {/* Lignes de séparation des heures - Drop zones */}
                      {Array.from({ length: CALENDAR_VISIBLE_HOURS }).map((_, index) => {
                        const isBlockedSlot = isBlockedCustomSlot(date, index);
                        return (
                        <div
                          key={index}
                          onClick={() => {
                            if (isDragging || isBlockedSlot) return;
                            // Sélectionner le premier staff disponible
                            if (hairdressers.length > 0) {
                              const hour = index + CALENDAR_START_HOUR;
                              const startDateTime = `${dateStr}T${String(hour).padStart(2, "0")}:00:00`;
                              const endDateTime = `${dateStr}T${String(hour + 1).padStart(2, "0")}:00:00`;

                              resetModalFields();
                              setSelectedResource(hairdressers[0].id);
                              setEventStartDate(startDateTime);
                              setEventEndDate(endDateTime);
                              openModal();
                            }
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (isBlockedSlot) return;
                            if (hairdressers.length > 0) {
                              handleDrop(hairdressers[0].id, index, date);
                            }
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                          }}
                          onDragEnter={(e) => {
                            e.preventDefault();
                            if (isBlockedSlot) return;
                            e.currentTarget.classList.add('bg-blue-50', 'dark:bg-blue-900/20');
                          }}
                          onDragLeave={(e) => {
                            if (isBlockedSlot) return;
                            e.currentTarget.classList.remove('bg-blue-50', 'dark:bg-blue-900/20');
                          }}
                          className={`h-24 border-b border-gray-200 dark:border-gray-700 calendar-grid-cell transition-all duration-200 ease-in-out relative ${isBlockedSlot ? "calendar-cell-blocked cursor-not-allowed" : "cursor-pointer group"}`}
                        >
                          {!isBlockedSlot && (
                            <>
                              <div className="absolute inset-0 bg-blue-500 opacity-0 group-hover:opacity-5 transition-opacity duration-200"></div>
                              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                              </div>
                            </>
                          )}
                        </div>
                        );
                      })}

                      {/* Rendez-vous pour ce jour */}
                      <div className="absolute top-0 left-0 right-0 pointer-events-none">
                        {dayEvents.map((appointment) => {
                          const startTime = new Date(appointment.start);
                          const endTime = new Date(appointment.end);
                          const startHour = startTime.getHours();
                          const startMinute = startTime.getMinutes();
                          const endHour = endTime.getHours();
                          const endMinute = endTime.getMinutes();

                          const startMinutes = (startHour - CALENDAR_START_HOUR) * 60 + startMinute;
                          const duration = (endHour - startHour) * 60 + (endMinute - startMinute);

                          const pixelPerMinute = 96 / 60; // 96px hauteur de cellule
                          const top = startMinutes * pixelPerMinute;
                          const height = duration * pixelPerMinute;

                          const staffMember = hairdressers.find(h => h.id === appointment.resourceId);

                          return (
                            <div
                              key={appointment.id}
                              draggable={!isCalendarReadOnly}
                              onDragStart={(e) => {
                                if (isCalendarReadOnly) return;
                                e.stopPropagation();
                                handleDragStart(appointment);
                              }}
                              onDragEnd={handleDragEnd}
                              onClick={(e) => {
                                if (isCalendarReadOnly || isDragging) return;
                                e.stopPropagation();
                                const event = {
                                  ...appointment,
                                  extendedProps: {
                                    ...appointment.extendedProps,
                                    resourceId: appointment.resourceId,
                                  },
                                };
                                setSelectedEvent(event);
                                setEventTitle(appointment.title);
                                setEventStartDate(appointment.start);
                                setEventEndDate(appointment.end);
                                setEventService(appointment.extendedProps?.serviceId || ""); // Utiliser serviceId
                                setSelectedResource(appointment.resourceId);
                                openModal();
                              }}
                              className={`absolute left-1 right-1 rounded-md p-2 shadow-sm border cursor-move hover:shadow-md transition-all duration-200 ease-in-out animate-fade-in overflow-hidden pointer-events-auto ${isDragging && draggedEvent?.id === appointment.id ? 'opacity-50' : ''
                                }`}
                              style={{
                                top: `${top}px`,
                                height: `${Math.max(height, 60)}px`,
                                backgroundColor: appointment.backgroundColor,
                                borderColor: appointment.borderColor,
                              }}
                            >
                              <div className="flex flex-col h-full justify-start">
                                <div className="text-[10px] font-semibold text-gray-800 mb-0.5 truncate">
                                  {startHour}:{String(startMinute).padStart(2, "0")}
                                </div>
                                <div className="text-xs font-bold text-gray-900 truncate leading-tight">
                                  {appointment.title || "Sans nom"}
                                </div>
                                {staffMember && (
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <img
                                      src={staffMember.avatar}
                                      alt={staffMember.title}
                                      className="w-3 h-3 rounded-full object-cover"
                                    />
                                    <span className="text-[9px] text-gray-700 truncate">
                                      {staffMember.title}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vue avec FullCalendar (individuelle OU mois) */}
      {useFullCalendar && (
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3 overflow-hidden">
          <div className="calendar-container p-4">
            <FullCalendar
              ref={calendarRef}
              plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
              initialView={getFullCalendarView()}
              locale={frLocale}
              headerToolbar={{
                left: "",
                center: "",
                right: "",
              }}
              initialDate={selectedDate}
              events={getFilteredEvents()}
              selectable={!isCalendarReadOnly}
              selectAllow={(selectInfo) => !isBlockedDateRange(selectInfo.start, selectInfo.end)}
              select={handleDateSelect}
              eventClick={handleEventClick}
              editable={!isCalendarReadOnly}
              eventAllow={(dropInfo) => !isBlockedDateRange(dropInfo.start, dropInfo.end)}
              eventDrop={handleEventDrop}
              eventResize={handleEventResize}
              eventDurationEditable={!isCalendarReadOnly}
              snapDuration="00:05:00"
              slotMinTime="08:00:00"
              slotMaxTime="20:00:00"
              slotDuration="00:20:00"
              slotLabelInterval="01:00:00"
              dayHeaderClassNames={(arg) => (arg.date.getDay() === 0 ? ["fc-day-header-sunday-gray"] : [])}
              dayCellClassNames={(arg) => (arg.date.getDay() === 0 ? ["fc-day-sunday-gray"] : [])}
              slotLaneClassNames={(arg) => {
                const classes: string[] = [];
                if (arg.date.getDay() === 0) {
                  classes.push("fc-slot-sunday-gray");
                }
                if (arg.date.getHours() === LUNCH_START_HOUR) {
                  classes.push("fc-slot-lunch-gray");
                }
                return classes;
              }}
              height="auto"
              contentHeight="auto"
              expandRows={true}
              allDaySlot={false}
              eventMinHeight={120}
              eventContent={(eventInfo) => {
                const staffMember = hairdressers.find(h => h.id === eventInfo.event.extendedProps.resourceId);
                return (
                  <div className="p-3 h-full overflow-hidden flex flex-col gap-2">
                    <div className="text-base font-bold text-gray-800 leading-snug">
                      {eventInfo.timeText}
                    </div>
                    <div className="text-lg font-bold text-gray-900 leading-snug">
                      {eventInfo.event.title || "Sans nom"}
                    </div>
                    {eventInfo.event.extendedProps.service && (
                      <div className="text-base text-gray-700 leading-snug">
                        {eventInfo.event.extendedProps.service}
                      </div>
                    )}
                    {staffMember && viewMode === "all" && (
                      <div className="flex items-center gap-2 mt-1">
                        <img
                          src={staffMember.avatar}
                          alt={staffMember.title}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                        <span className="text-sm text-gray-600">
                          {staffMember.title}
                        </span>
                      </div>
                    )}
                  </div>
                );
              }}
            />
          </div>
        </div>
      )}

      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        className="max-w-[1000px] w-full p-6 lg:p-10"
      >
        <div className="flex flex-col overflow-visible">
          <div className="mb-6">
            <h5 className="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
              {selectedEvent ? "Modifier le Rendez-vous" : "Ajouter un Rendez-vous"}
            </h5>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Gérez les rendez-vous de vos coiffeurs
            </p>
          </div>

          {/* Disposition en 2 colonnes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* COLONNE GAUCHE - Formulaire */}
            <div className="space-y-5">
              {/* Nom du client */}
              <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                {selectedEvent ? "Nom du Client" : "Client"}
              </label>
              {selectedEvent ? (
                // Modal de MODIFICATION - Ancien champ texte simple
                <>
                  <input
                    type="text"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    disabled={true}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-800"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Le nom du client ne peut pas être modifié
                  </p>
                </>
              ) : (
                // Modal d'AJOUT - Nouveau champ autocomplete
                <ClientAutocomplete
                  salonId={undefined}
                  value={selectedClient}
                  onChange={(client) => {
                    setSelectedClient(client);
                    if (client) {
                      setEventTitle(`${client.firstName} ${client.lastName}`);
                    } else {
                      setEventTitle('');
                    }
                  }}
                  placeholder="Rechercher un client (nom, email, téléphone)..."
                  disabled={false}
                  hint="Tapez au moins 2 caractères pour rechercher"
                />
              )}
            </div>

            {/* Sélection du coiffeur */}
            <div className="mt-6">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Coiffeur
              </label>
              <select
                value={selectedResource}
                onChange={(e) => setSelectedResource(e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
              >
                <option value="">Sélectionner un coiffeur</option>
                {hairdressers.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Service */}
            <div className="mt-6">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Service
              </label>
              <select
                value={eventService}
                onChange={(e) => setEventService(e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
              >
                <option value="">Sélectionner un service</option>
                {services.length > 0 ? (
                  services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name} - {service.duration}min - {service.price}€
                    </option>
                  ))
                ) : (
                  <option value="">Aucun service disponible</option>
                )}
              </select>
            </div>

            {/* Sélection de la date */}
            {/* Sélection de la date */}
            <div className="mt-6 modal-datepicker-container">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Date du rendez-vous
              </label>
              <div className="relative">
                <input
                  type="date" // On force le type date dès le début
                  value={selectedBookingDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => {
                    setSelectedBookingDate(e.target.value);
                    setSelectedTimeSlot('');
                    setEventStartDate('');
                    setEventEndDate('');
                  }}
                  // Cette fonction force l'ouverture du calendrier natif au clic
                  onClick={(e) => {
                    try {
                      // showPicker est supporté par les navigateurs modernes
                      if ('showPicker' in HTMLInputElement.prototype) {
                        e.currentTarget.showPicker();
                      }
                    } catch (error) {
                      console.log(error);
                    }
                  }}
                  className={`h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 cursor-pointer ${!selectedBookingDate ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'
                    }`}
                />

                {/* Optionnel: Icône de calendrier personnalisée positionnée en absolute si vous voulez cacher celle du navigateur */}
                {!selectedBookingDate && (
                  <div className="pointer-events-none absolute inset-0 flex items-center pl-4 text-sm text-gray-400">
                    <span className="hidden sm:inline">Sélectionner une date</span>
                  </div>
                )}
              </div>

              {!selectedResource && (
                <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                  Veuillez d'abord sélectionner un coiffeur
                </p>
              )}
              {!eventService && selectedResource && (
                <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                  Veuillez d'abord sélectionner un service
                </p>
              )}
              </div>

              {/* Affichage des heures calculées */}
              {selectedTimeSlot && eventStartDate && eventEndDate && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                      Horaires du rendez-vous
                    </h4>
                  </div>
                  <div className="space-y-1 text-sm text-blue-700 dark:text-blue-300">
                    <div>
                      <span className="font-medium">Début :</span> {new Date(eventStartDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div>
                      <span className="font-medium">Fin :</span> {new Date(eventEndDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div>
                      <span className="font-medium">Durée :</span> {services.find(s => s.id === eventService)?.duration || 0} minutes
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* COLONNE DROITE - Créneaux horaires */}
            <div className="flex flex-col">
              {selectedBookingDate && selectedResource && eventService ? (
                <>
                  <label className="mb-3 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Sélectionner l'heure de début
                  </label>

                  {availableTimeSlots.length > 0 ? (
                  <div className="max-h-[300px] overflow-y-auto custom-scrollbar border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-900">
                    <div className="grid grid-cols-3 gap-2">
                      {availableTimeSlots.map((slot, index) => {
                        // Format français 24h (ex: 08:00, 14:30)
                        const displayTime = slot.time;

                        return (
                          <button
                            key={index}
                            type="button"
                            disabled={!slot.available}
                            onClick={() => slot.available && handleTimeSlotClick(slot.time)}
                            className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${selectedTimeSlot === slot.time
                                ? 'bg-brand-500 text-white border-2 border-brand-600'
                                : slot.available
                                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20'
                                  : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 border border-gray-200 dark:border-gray-700 cursor-not-allowed opacity-50'
                              }`}
                          >
                            {displayTime}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900">
                    <p>Génération des créneaux disponibles...</p>
                  </div>
                )}
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-center py-12 text-gray-400 dark:text-gray-500 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                  <div>
                    <svg className="mx-auto h-12 w-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm">
                      Sélectionnez un coiffeur, un service<br />et une date pour voir les créneaux disponibles
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {!isCalendarReadOnly && (
            <div className="flex items-center gap-3 mt-6 modal-footer sm:justify-between">
              <div>
                {selectedEvent && (
                  <button
                    onClick={handleDeleteEvent}
                    type="button"
                    disabled={loading}
                    className="flex justify-center rounded-lg border border-red-300 bg-white px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Supprimer
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={closeModal}
                  type="button"
                  disabled={loading}
                  className="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddOrUpdateEvent}
                  type="button"
                  disabled={loading || !eventStartDate || !eventEndDate || !selectedTimeSlot}
                  className="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Enregistrement..." : selectedEvent ? "Mettre à jour" : "Ajouter"}
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Calendrier;

