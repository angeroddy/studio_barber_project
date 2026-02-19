import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '../services/api'
import {
  checkAvailability,
  createBooking,
  getBookingsBySalon,
  updateBookingStatus
} from '../services/booking.service'

vi.mock('../services/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn()
  }
}))

describe('booking.service', () => {
  const mockedApi = api as unknown as {
    post: ReturnType<typeof vi.fn>
    get: ReturnType<typeof vi.fn>
    put: ReturnType<typeof vi.fn>
    delete: ReturnType<typeof vi.fn>
    patch: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates booking and returns payload data', async () => {
    const data = {
      salonId: 'salon-1',
      staffId: 'staff-1',
      serviceId: 'service-1',
      clientName: 'John Doe',
      startTime: '2026-02-19T10:00:00.000Z',
      endTime: '2026-02-19T11:00:00.000Z'
    }

    mockedApi.post.mockResolvedValue({
      data: {
        success: true,
        data: { id: 'booking-1', ...data }
      }
    })

    const result = await createBooking(data)

    expect(mockedApi.post).toHaveBeenCalledWith('/bookings', data)
    expect(result.id).toBe('booking-1')
  })

  it('throws when create booking response is unsuccessful', async () => {
    mockedApi.post.mockResolvedValue({
      data: {
        success: false,
        message: 'Erreur metier'
      }
    })

    await expect(
      createBooking({
        salonId: 'salon-1',
        staffId: 'staff-1',
        serviceId: 'service-1',
        clientName: 'John Doe',
        startTime: '2026-02-19T10:00:00.000Z',
        endTime: '2026-02-19T11:00:00.000Z'
      })
    ).rejects.toThrow('Erreur metier')
  })

  it('loads bookings by salon with default high limit', async () => {
    mockedApi.get.mockResolvedValue({
      data: {
        success: true,
        data: [{ id: 'b1' }]
      }
    })

    const result = await getBookingsBySalon('salon-1', { status: 'CONFIRMED', page: 2 })

    expect(mockedApi.get).toHaveBeenCalledWith('/bookings/salon/salon-1', {
      params: { status: 'CONFIRMED', page: 2, limit: 1000 }
    })
    expect(result).toEqual([{ id: 'b1' }])
  })

  it('updates booking status using PATCH endpoint', async () => {
    mockedApi.patch.mockResolvedValue({
      data: {
        success: true,
        data: { id: 'b1', status: 'COMPLETED' }
      }
    })

    const result = await updateBookingStatus('b1', 'COMPLETED')

    expect(mockedApi.patch).toHaveBeenCalledWith('/bookings/b1/status', {
      status: 'COMPLETED'
    })
    expect(result.status).toBe('COMPLETED')
  })

  it('checks slot availability and returns conflict payload', async () => {
    mockedApi.post.mockResolvedValue({
      data: {
        success: true,
        data: {
          available: false,
          conflictingBookings: [{ id: 'booking-conflict' }]
        }
      }
    })

    const result = await checkAvailability(
      'staff-1',
      '2026-02-19T10:00:00.000Z',
      '2026-02-19T11:00:00.000Z',
      'booking-to-ignore'
    )

    expect(mockedApi.post).toHaveBeenCalledWith('/bookings/check-availability', {
      staffId: 'staff-1',
      startTime: '2026-02-19T10:00:00.000Z',
      endTime: '2026-02-19T11:00:00.000Z',
      excludeBookingId: 'booking-to-ignore'
    })
    expect(result.available).toBe(false)
    expect(result.conflictingBookings).toHaveLength(1)
  })
})
