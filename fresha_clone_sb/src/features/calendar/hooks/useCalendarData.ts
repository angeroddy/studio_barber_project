import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { getStaffBySalon } from '@/services/staff.service'
import { getServicesBySalon } from '@/services/service.service'
import { getSchedulesBySalon } from '@/services/schedule.service'
import { getBookingsBySalon } from '@/services/booking.service'
import type { Staff } from '@/services/staff.service'
import type { Booking } from '@/services/booking.service'
import type { Schedule } from '@/services/schedule.service'

export function useCalendarData(salonId: string | undefined) {
  const [hairdressers, setHairdressers] = useState<Staff[]>([])
  const [services, setServices] = useState<any[]>([])
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!salonId) return

    setLoading(true)
    setError(null)

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
      const errorMessage = err.message || 'Erreur lors du chargement des données'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [salonId])

  useEffect(() => {
    if (salonId) {
      fetchData()
    }
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
