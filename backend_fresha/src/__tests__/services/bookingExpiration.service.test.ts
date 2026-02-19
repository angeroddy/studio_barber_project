import prisma from '../../config/database'
import {
  expireUnverifiedPendingBookings,
  getSlotHoldMinutes
} from '../../services/bookingExpiration.service'

jest.mock('../../config/database', () => ({
  __esModule: true,
  default: {
    booking: {
      updateMany: jest.fn()
    }
  }
}))

describe('bookingExpiration.service', () => {
  const mockedUpdateMany = (prisma as any).booking.updateMany as jest.Mock
  const originalEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...originalEnv }
    jest.useFakeTimers().setSystemTime(new Date('2026-02-19T12:00:00.000Z'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  afterAll(() => {
    process.env = originalEnv
  })

  describe('getSlotHoldMinutes', () => {
    it('returns default hold duration when env is missing', () => {
      delete process.env.CLIENT_SLOT_HOLD_MINUTES
      expect(getSlotHoldMinutes()).toBe(10)
    })

    it('returns configured hold duration when env is valid', () => {
      process.env.CLIENT_SLOT_HOLD_MINUTES = '25'
      expect(getSlotHoldMinutes()).toBe(25)
    })

    it('falls back to default for invalid config values', () => {
      process.env.CLIENT_SLOT_HOLD_MINUTES = 'invalid'
      expect(getSlotHoldMinutes()).toBe(10)

      process.env.CLIENT_SLOT_HOLD_MINUTES = '-5'
      expect(getSlotHoldMinutes()).toBe(10)
    })
  })

  describe('expireUnverifiedPendingBookings', () => {
    it('cancels expired unverified pending bookings and returns affected count', async () => {
      process.env.CLIENT_SLOT_HOLD_MINUTES = '15'
      mockedUpdateMany.mockResolvedValue({ count: 4 })

      const result = await expireUnverifiedPendingBookings()

      expect(result).toBe(4)
      expect(mockedUpdateMany).toHaveBeenCalledTimes(1)

      const query = mockedUpdateMany.mock.calls[0][0]
      expect(query.where.status).toBe('PENDING')
      expect(query.where.canceledAt).toBeNull()
      expect(query.where.client).toEqual({
        is: {
          emailVerificationRequired: true,
          emailVerifiedAt: null
        }
      })
      expect(query.where.createdAt.lte.toISOString()).toBe('2026-02-19T11:45:00.000Z')
      expect(query.data.status).toBe('CANCELED')
      expect(query.data.canceledAt.toISOString()).toBe('2026-02-19T12:00:00.000Z')
    })
  })
})
