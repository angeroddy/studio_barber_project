import logger from '../../config/logger'
import { bookingExpirationMiddleware } from '../../middlewares/bookingExpiration.middleware'
import { expireUnverifiedPendingBookings } from '../../services/bookingExpiration.service'

jest.mock('../../services/bookingExpiration.service', () => ({
  expireUnverifiedPendingBookings: jest.fn()
}))

jest.mock('../../config/logger', () => ({
  __esModule: true,
  default: {
    error: jest.fn()
  }
}))

describe('bookingExpiration.middleware', () => {
  const mockedExpireUnverifiedPendingBookings = expireUnverifiedPendingBookings as jest.Mock
  const mockedLogger = logger as unknown as { error: jest.Mock }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('runs expiration job and continues request pipeline', async () => {
    mockedExpireUnverifiedPendingBookings.mockResolvedValue(2)

    const req = {} as any
    const res = {} as any
    const next = jest.fn()

    await bookingExpirationMiddleware(req, res, next)

    expect(mockedExpireUnverifiedPendingBookings).toHaveBeenCalledTimes(1)
    expect(next).toHaveBeenCalledTimes(1)
  })

  it('logs expiration errors and still calls next', async () => {
    mockedExpireUnverifiedPendingBookings.mockRejectedValue(new Error('db down'))

    const req = {} as any
    const res = {} as any
    const next = jest.fn()

    await bookingExpirationMiddleware(req, res, next)

    expect(mockedLogger.error).toHaveBeenCalledTimes(1)
    expect(next).toHaveBeenCalledTimes(1)
  })
})
