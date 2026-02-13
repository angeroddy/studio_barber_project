# Plan de Refactoring du Calendrier

## État Actuel

**Fichier** : `src/pages/calendrier/calendrier.tsx`
- **Taille** : 1,992 lignes (MEGA-COMPONENT)
- **JSX** : 888 lignes
- **useState hooks** : 15+
- **Fonctions** : 15+ handlers et utilitaires

**Problèmes** :
❌ Violation du principe de responsabilité unique
❌ Difficile à tester
❌ Difficile à maintenir
❌ Code dupliqué entre vues
❌ Logique métier mélangée avec UI
❌ Impossible à réutiliser

---

## Architecture Cible

```
src/
├── features/
│   └── calendar/
│       ├── Calendar.tsx (200-300 lines) - Conteneur principal
│       ├── CalendarHeader.tsx - Contrôles de navigation
│       ├── views/
│       │   ├── DayView.tsx - Vue journalière
│       │   ├── WeekView.tsx - Vue hebdomadaire
│       │   └── MonthView.tsx - Vue mensuelle (FullCalendar)
│       ├── components/
│       │   ├── EventModal.tsx - Modal création/édition
│       │   ├── EventCard.tsx - Carte d'événement
│       │   ├── TimeSlotSelector.tsx - Sélection de créneau
│       │   ├── TimeGrid.tsx - Grille horaire
│       │   └── StaffColumn.tsx - Colonne d'un staff
│       ├── hooks/
│       │   ├── useCalendarData.ts - Data fetching
│       │   ├── useCalendarEvents.ts - Gestion des événements
│       │   ├── useAvailableSlots.ts - Créneaux disponibles
│       │   └── useDragAndDrop.ts - Drag and drop
│       ├── types/
│       │   └── calendar.types.ts - Interfaces TypeScript
│       └── utils/
│           ├── timeUtils.ts - Fonctions de date/heure
│           └── eventUtils.ts - Conversion booking <-> event
```

---

## Étape 1 : Extraire les Types (FAIT)

**Fichier** : `src/features/calendar/types/calendar.types.ts`

```typescript
export interface HairdresserResource {
  id: string
  title: string
  avatar: string
}

export interface CalendarEvent extends EventInput {
  resourceId: string
  title: string
  start: string
  end: string
  backgroundColor?: string
  borderColor?: string
  extendedProps?: {
    service?: string
    serviceId?: string
    resourceId?: string
    bookingId?: string
    status?: string
    clientEmail?: string
    clientPhone?: string
    notes?: string
  }
}

export type TimeView = "day" | "week" | "month"
export type ViewMode = "all" | "single"

export interface TimeSlot {
  time: string
  available: boolean
}
```

---

## Étape 2 : Extraire les Hooks de Données

### useCalendarData.ts

```typescript
export function useCalendarData(salonId: string) {
  const [hairdressers, setHairdressers] = useState<Staff[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [staffData, servicesData, schedulesData, bookingsData] = await Promise.all([
        getStaffBySalon(salonId),
        getServicesBySalon(salonId),
        getSchedulesBySalon(salonId),
        getBookingsBySalon(salonId),
      ])
      setHairdressers(staffData)
      setServices(servicesData)
      setSchedules(schedulesData)
      setBookings(bookingsData)
    } catch (err: any) {
      setError(err.message)
      toast.error('Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }, [salonId])

  useEffect(() => {
    if (salonId) fetchData()
  }, [salonId, fetchData])

  return {
    hairdressers,
    services,
    schedules,
    bookings,
    loading,
    error,
    refetch: fetchData,
  }
}
```

### useCalendarEvents.ts

```typescript
export function useCalendarEvents(
  bookings: Booking[],
  hairdressers: Staff[],
  services: Service[]
) {
  const [events, setEvents] = useState<CalendarEvent[]>([])

  useEffect(() => {
    const mappedEvents = bookings.map(booking => ({
      id: booking.id,
      resourceId: booking.staffId,
      title: `${booking.clientName} - ${booking.serviceName}`,
      start: booking.startTime,
      end: booking.endTime,
      backgroundColor: getStatusColor(booking.status),
      extendedProps: {
        service: booking.serviceName,
        serviceId: booking.serviceId,
        bookingId: booking.id,
        status: booking.status,
        clientEmail: booking.clientEmail,
        clientPhone: booking.clientPhone,
        notes: booking.notes,
      },
    }))
    setEvents(mappedEvents)
  }, [bookings, hairdressers, services])

  return { events, setEvents }
}
```

---

## Étape 3 : Extraire EventModal

**Fichier** : `src/features/calendar/components/EventModal.tsx` (VOIR EXEMPLE CI-DESSOUS)

Responsabilités :
- Formulaire de création/édition d'événement
- Validation des données
- Soumission API
- Sélection de client
- Sélection de service
- Sélection de staff
- Sélection de créneau horaire

---

## Étape 4 : Extraire les Vues

### DayView.tsx

```typescript
interface DayViewProps {
  date: Date
  events: CalendarEvent[]
  staff: HairdresserResource[]
  schedules: Schedule[]
  onEventClick: (event: CalendarEvent) => void
  onTimeSlotClick: (staffId: string, time: string) => void
  readOnly?: boolean
}

export function DayView({ date, events, staff, onEventClick, onTimeSlotClick }: DayViewProps) {
  const timeSlots = generateTimeSlots(8, 20, 30) // 8h-20h, intervalles de 30min

  return (
    <div className="day-view">
      <div className="staff-headers">
        {staff.map(s => (
          <StaffHeader key={s.id} staff={s} />
        ))}
      </div>
      <TimeGrid
        timeSlots={timeSlots}
        staff={staff}
        events={events}
        onEventClick={onEventClick}
        onTimeSlotClick={onTimeSlotClick}
      />
    </div>
  )
}
```

### WeekView.tsx

Similaire à DayView mais avec 7 jours

---

## Étape 5 : Extraire CalendarHeader

```typescript
interface CalendarHeaderProps {
  date: Date
  viewMode: ViewMode
  timeView: TimeView
  onDateChange: (date: Date) => void
  onViewModeChange: (mode: ViewMode) => void
  onTimeViewChange: (view: TimeView) => void
  onRefresh: () => void
  loading?: boolean
}

export function CalendarHeader({
  date,
  viewMode,
  timeView,
  onDateChange,
  onViewModeChange,
  onTimeViewChange,
  onRefresh,
  loading,
}: CalendarHeaderProps) {
  return (
    <div className="calendar-header">
      <DateNavigator date={date} onChange={onDateChange} />
      <ViewToggle active={timeView} onChange={onTimeViewChange} />
      <ModeToggle active={viewMode} onChange={onViewModeChange} />
      <RefreshButton onClick={onRefresh} loading={loading} />
    </div>
  )
}
```

---

## Étape 6 : Composant Calendar Principal

```typescript
// src/features/calendar/Calendar.tsx
export function Calendar({ readOnly = false }: CalendarProps) {
  const { selectedSalon } = useSalon()
  const [viewMode, setViewMode] = useState<ViewMode>("all")
  const [timeView, setTimeView] = useState<TimeView>("day")
  const [selectedDate, setSelectedDate] = useState(new Date())

  // Hook de données (remplace 50+ lignes)
  const { hairdressers, services, schedules, bookings, loading, refetch } =
    useCalendarData(selectedSalon?.id)

  // Hook d'événements (remplace 30+ lignes)
  const { events } = useCalendarEvents(bookings, hairdressers, services)

  // Hook de modal (déjà existant)
  const modal = useModal()

  // Handlers simplifiés
  const handleEventClick = (event: CalendarEvent) => {
    if (!readOnly) {
      setSelectedEvent(event)
      modal.openModal()
    }
  }

  const handleTimeSlotClick = (staffId: string, time: string) => {
    if (!readOnly) {
      // Préparer données pour nouveau booking
      modal.openModal()
    }
  }

  return (
    <div className="calendar-container">
      <CalendarHeader
        date={selectedDate}
        viewMode={viewMode}
        timeView={timeView}
        onDateChange={setSelectedDate}
        onViewModeChange={setViewMode}
        onTimeViewChange={setTimeView}
        onRefresh={refetch}
        loading={loading}
      />

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          {timeView === 'day' && (
            <DayView
              date={selectedDate}
              events={events}
              staff={hairdressers}
              schedules={schedules}
              onEventClick={handleEventClick}
              onTimeSlotClick={handleTimeSlotClick}
              readOnly={readOnly}
            />
          )}
          {timeView === 'week' && (
            <WeekView /* props */ />
          )}
          {timeView === 'month' && (
            <MonthView /* props */ />
          )}
        </>
      )}

      <EventModal
        isOpen={modal.isOpen}
        onClose={modal.closeModal}
        event={selectedEvent}
        staff={hairdressers}
        services={services}
        onSubmit={handleEventSubmit}
      />
    </div>
  )
}
```

**Résultat** : ~200-300 lignes au lieu de 1,992 !

---

## Bénéfices du Refactoring

### Avant
- ❌ 1,992 lignes monolithiques
- ❌ 15+ useState mélangés
- ❌ Logique UI et métier mélangées
- ❌ Impossible à tester unitairement
- ❌ Difficile à débugger
- ❌ Pas réutilisable

### Après
- ✅ Composants de 50-200 lignes chacun
- ✅ Séparation claire des responsabilités
- ✅ Hooks réutilisables
- ✅ Testable unitairement
- ✅ Facile à débugger
- ✅ Composants réutilisables
- ✅ Meilleure performance (mémoïsation possible)

---

## Ordre d'Implémentation

1. **Créer le dossier** `src/features/calendar/`
2. **Extraire les types** → `types/calendar.types.ts`
3. **Créer les hooks** → `hooks/useCalendarData.ts`, etc.
4. **Extraire EventModal** → `components/EventModal.tsx`
5. **Extraire les vues** → `views/DayView.tsx`, `WeekView.tsx`
6. **Extraire CalendarHeader** → `CalendarHeader.tsx`
7. **Refactoriser Calendar** → Utiliser les nouveaux composants
8. **Tester** → S'assurer que tout fonctionne
9. **Supprimer l'ancien** → `pages/calendrier/calendrier.tsx`

---

## Migration Progressive

Il n'est **pas nécessaire** de tout faire d'un coup :

1. **Phase 1** : Créer les nouveaux composants à côté de l'ancien
2. **Phase 2** : Basculer progressivement vers les nouveaux composants
3. **Phase 3** : Supprimer l'ancien une fois que tout fonctionne

## Temps Estimé

- Types et hooks : 2-3 heures
- EventModal : 2-3 heures
- Vues (Day/Week/Month) : 4-6 heures
- CalendarHeader : 1-2 heures
- Tests et debug : 2-3 heures

**Total** : 11-17 heures de développement
