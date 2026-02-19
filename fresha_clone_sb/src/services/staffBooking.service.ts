import api from './api'

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED' | 'NO_SHOW'

export interface StaffBooking {
  id: string
  salonId: string
  clientId: string
  staffId?: string | null
  serviceId?: string | null
  startTime: string
  endTime: string
  duration: number
  isMultiService?: boolean
  status: BookingStatus
  price: number
  paid: boolean
  notes?: string
  internalNotes?: string
  client: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string
  }
  service: {
    id: string
    name: string
    duration: number
    price: number
    category: string
    color?: string
  } | null
  salon?: {
    id: string
    name: string
    address: string
    phone: string
  }
  staff?: {
    id: string
    firstName: string
    lastName: string
    avatar?: string
    role: string
  }
  bookingServices?: Array<{
    id: string
    bookingId: string
    serviceId: string
    staffId: string
    duration: number
    price: number
    order: number
    startTime: string
    endTime: string
    service: {
      id: string
      name: string
      duration: number
      price: number
      category: string
    }
    staff: {
      id: string
      firstName: string
      lastName: string
      avatar?: string
      role: string
    }
  }>
}

export interface BookingFilters {
  status?: BookingStatus
  startDate?: string
  endDate?: string
  limit?: number
  offset?: number
  staffIdFilter?: string
}

export interface BookingStats {
  total: number
  byStatus: {
    completed: number
    pending: number
    canceled: number
    inProgress: number
    confirmed: number
  }
  totalRevenue: number
}

class StaffBookingService {
  async getMyBookings(filters?: BookingFilters): Promise<{ bookings: StaffBooking[], total: number }> {
    const params = new URLSearchParams()
    if (filters?.status) params.append('status', filters.status)
    if (filters?.startDate) params.append('startDate', filters.startDate)
    if (filters?.endDate) params.append('endDate', filters.endDate)
    if (filters?.limit) params.append('limit', filters.limit.toString())
    if (filters?.offset) params.append('offset', filters.offset.toString())

    const response = await api.get(`/staff-bookings/my-bookings?${params.toString()}`)

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Erreur lors de la récupération des rendez-vous')
    }

    return {
      bookings: response.data.data,
      total: response.data.total || response.data.count
    }
  }

  async getSalonBookings(filters?: BookingFilters): Promise<StaffBooking[]> {
    const params = new URLSearchParams()
    if (filters?.status) params.append('status', filters.status)
    if (filters?.startDate) params.append('startDate', filters.startDate)
    if (filters?.endDate) params.append('endDate', filters.endDate)
    if (filters?.staffIdFilter) params.append('staffIdFilter', filters.staffIdFilter)

    const response = await api.get(`/staff-bookings/salon-bookings?${params.toString()}`)

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Erreur lors de la récupération des rendez-vous')
    }

    return response.data.data
  }

  async getMyBookingStats(startDate?: string, endDate?: string): Promise<BookingStats> {
    const params = new URLSearchParams()
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)

    const response = await api.get(`/staff-bookings/my-stats?${params.toString()}`)

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Erreur lors de la récupération des statistiques')
    }

    return response.data.data
  }

  async updateBookingStatus(bookingId: string, status: BookingStatus): Promise<StaffBooking> {
    const response = await api.patch(`/staff-bookings/${bookingId}/status`, { status })

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Erreur lors de la mise à jour du statut')
    }

    return response.data.data
  }

  async addInternalNotes(bookingId: string, internalNotes: string): Promise<StaffBooking> {
    const response = await api.patch(`/staff-bookings/${bookingId}/notes`, { internalNotes })

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Erreur lors de l\'ajout des notes')
    }

    return response.data.data
  }
}

export default new StaffBookingService()
