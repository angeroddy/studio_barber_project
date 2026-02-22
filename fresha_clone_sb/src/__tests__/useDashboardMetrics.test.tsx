import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useDashboardMetrics } from '../hooks/useDashboardMetrics'
import { getBookingsBySalon } from '../services/booking.service'
import { getClientsBySalon } from '../services/client.service'

vi.mock('../services/booking.service', () => ({
  getBookingsBySalon: vi.fn()
}))

vi.mock('../services/client.service', () => ({
  getClientsBySalon: vi.fn()
}))

describe('useDashboardMetrics', () => {
  const mockedGetBookingsBySalon = getBookingsBySalon as unknown as ReturnType<typeof vi.fn>
  const mockedGetClientsBySalon = getClientsBySalon as unknown as ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns immediately when salonId is empty', async () => {
    const { result } = renderHook(() => useDashboardMetrics(''))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(mockedGetBookingsBySalon).not.toHaveBeenCalled()
    expect(mockedGetClientsBySalon).not.toHaveBeenCalled()
    expect(result.current.error).toBeNull()
  })

  it('computes dashboard metrics from bookings and clients', async () => {
    const now = new Date()
    const clientCreatedThisWeek = new Date(now)
    clientCreatedThisWeek.setDate(now.getDate() - 1)
    const clientCreatedLastWeek = new Date(now)
    clientCreatedLastWeek.setDate(now.getDate() - 9)

    mockedGetBookingsBySalon
      .mockResolvedValueOnce([
        {
          id: 'b1',
          status: 'CONFIRMED',
          price: 100,
          duration: 60
        },
        {
          id: 'b2',
          status: 'CANCELED',
          price: 80,
          duration: 45
        }
      ])
      .mockResolvedValueOnce([
        {
          id: 'b3',
          status: 'CONFIRMED',
          price: 50,
          duration: 30
        }
      ])

    mockedGetClientsBySalon.mockResolvedValue([
      { id: 'c1', createdAt: clientCreatedThisWeek },
      { id: 'c2', createdAt: clientCreatedLastWeek }
    ])

    const { result } = renderHook(() => useDashboardMetrics('salon-1'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(mockedGetBookingsBySalon).toHaveBeenCalledTimes(2)
    expect(mockedGetClientsBySalon).toHaveBeenCalledWith('salon-1', true)

    expect(result.current.metrics.newClientsWeek).toBe(1)
    expect(result.current.metrics.newClientsWeekChange).toBe(0)
    expect(result.current.metrics.bookingsToday).toBe(1)
    expect(result.current.metrics.bookingsTodayChange).toBe(0)
    expect(result.current.metrics.revenueToday).toBe(100)
    expect(result.current.metrics.revenueTodayChange).toBe(100)
    expect(result.current.metrics.occupancyRateToday).toBeCloseTo(12.5, 2)
    expect(result.current.metrics.occupancyRateTodayChange).toBeCloseTo(100, 2)
  })

  it('surfaces errors when metrics loading fails', async () => {
    mockedGetBookingsBySalon.mockRejectedValue(new Error('API down'))

    const { result } = renderHook(() => useDashboardMetrics('salon-1'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('API down')
  })
})
