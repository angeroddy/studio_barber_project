import { bookingApi } from '../api/booking.api'
import { apiRequest } from '../api/config'
import { resolveSalonId } from '../api/salon-id.util'

vi.mock('../api/config', () => ({
  apiRequest: vi.fn()
}))

vi.mock('../api/salon-id.util', () => ({
  resolveSalonId: vi.fn()
}))

describe('bookingApi', () => {
  const mockedApiRequest = apiRequest as unknown as ReturnType<typeof vi.fn>
  const mockedResolveSalonId = resolveSalonId as unknown as ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    mockedResolveSalonId.mockImplementation(async (id: string) => id)
  })

  it('creates booking with resolved salon id', async () => {
    mockedResolveSalonId.mockResolvedValue('salon-resolved')
    mockedApiRequest.mockResolvedValue({
      success: true,
      data: {
        id: 'booking-1'
      }
    })

    const payload = {
      salonId: 'my-salon-slug',
      staffId: 'staff-1',
      serviceId: 'service-1',
      date: '2026-02-19',
      startTime: '10:00'
    }

    const result = await bookingApi.createBooking(payload)

    expect(mockedApiRequest).toHaveBeenCalledWith('/bookings', {
      method: 'POST',
      body: JSON.stringify({
        ...payload,
        salonId: 'salon-resolved'
      })
    })
    expect(result).toEqual({ id: 'booking-1' })
  })

  it('builds salon bookings endpoint with optional query parameters', async () => {
    mockedResolveSalonId.mockResolvedValue('salon-1')
    mockedApiRequest.mockResolvedValue({
      success: true,
      data: [{ id: 'booking-1' }]
    })

    const result = await bookingApi.getBookingsBySalon('slug', {
      date: '2026-02-19',
      status: 'CONFIRMED'
    })

    expect(mockedApiRequest).toHaveBeenCalledWith(
      '/bookings/salon/salon-1?date=2026-02-19&status=CONFIRMED'
    )
    expect(result).toEqual([{ id: 'booking-1' }])
  })

  it('returns empty array when availability response has no data', async () => {
    mockedApiRequest.mockResolvedValue({ success: true })

    const result = await bookingApi.checkAvailability({
      salonId: 'salon-1',
      serviceId: 'service-1',
      date: '2026-02-19'
    })

    expect(result).toEqual([])
  })

  it('builds available slots query with resolved salon id', async () => {
    mockedResolveSalonId.mockResolvedValue('salon-resolved')
    mockedApiRequest.mockResolvedValue({
      success: true,
      data: ['09:00', '09:30']
    })

    const result = await bookingApi.getAvailableSlots(
      'slug',
      'staff-1',
      'service-1',
      '2026-02-19'
    )

    expect(mockedApiRequest).toHaveBeenCalledWith(
      '/bookings/available-slots?salonId=salon-resolved&staffId=staff-1&serviceId=service-1&date=2026-02-19'
    )
    expect(result).toEqual(['09:00', '09:30'])
  })

  it('cancels booking through status update endpoint', async () => {
    mockedApiRequest.mockResolvedValue({
      success: true,
      data: { id: 'booking-1', status: 'CANCELED' }
    })

    const result = await bookingApi.cancelBooking('booking-1')

    expect(mockedApiRequest).toHaveBeenCalledWith('/bookings/booking-1/status', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'CANCELED' })
    })
    expect(result.status).toBe('CANCELED')
  })
})
