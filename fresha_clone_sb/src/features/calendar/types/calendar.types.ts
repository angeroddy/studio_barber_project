import type { EventInput } from "@fullcalendar/core"

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

export interface CalendarProps {
  readOnly?: boolean
}

export interface CalendarHeaderProps {
  date: Date
  viewMode: ViewMode
  timeView: TimeView
  onDateChange: (date: Date) => void
  onViewModeChange: (mode: ViewMode) => void
  onTimeViewChange: (view: TimeView) => void
  onRefresh: () => void
  loading?: boolean
}

export interface DayViewProps {
  date: Date
  events: CalendarEvent[]
  staff: HairdresserResource[]
  onEventClick: (event: CalendarEvent) => void
  onTimeSlotClick: (staffId: string, time: string) => void
  readOnly?: boolean
}

export interface EventModalProps {
  isOpen: boolean
  onClose: () => void
  event: CalendarEvent | null
  staff: any[]
  services: any[]
  onSubmit: (data: any) => Promise<void>
}
