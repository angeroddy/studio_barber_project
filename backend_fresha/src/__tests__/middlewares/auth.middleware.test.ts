import { authMiddleware } from '../../middlewares/auth.middleware'
import { verifyToken } from '../../utils/jwt.util'

jest.mock('../../utils/jwt.util', () => ({
  verifyToken: jest.fn()
}))

jest.mock('../../config/authCookie', () => ({
  getAuthCookieName: jest.fn(() => 'auth_token')
}))

describe('auth.middleware', () => {
  const mockedVerifyToken = verifyToken as jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
  })

  function createResponse() {
    return {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    } as any
  }

  it('returns 401 when no token is provided', async () => {
    const req = { headers: {} } as any
    const res = createResponse()
    const next = jest.fn()

    await authMiddleware(req, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Token manquant'
    })
  })

  it('authenticates with bearer token and sets owner user type', async () => {
    mockedVerifyToken.mockReturnValue({
      userId: 'owner-1',
      email: 'owner@test.com',
      userType: 'owner'
    })

    const req = {
      headers: {
        authorization: 'Bearer header-token'
      }
    } as any
    const res = createResponse()
    const next = jest.fn()

    await authMiddleware(req, res, next)

    expect(mockedVerifyToken).toHaveBeenCalledWith('header-token')
    expect(req.user).toEqual({
      userId: 'owner-1',
      email: 'owner@test.com',
      userType: 'owner',
      salonId: undefined,
      role: undefined
    })
    expect(next).toHaveBeenCalledTimes(1)
  })

  it('prefers cookie token over authorization header token', async () => {
    mockedVerifyToken.mockReturnValue({
      userId: 'staff-1',
      email: 'staff@test.com',
      userType: 'staff'
    })

    const req = {
      headers: {
        cookie: 'foo=bar; auth_token=cookie%2Etoken',
        authorization: 'Bearer header-token'
      }
    } as any
    const res = createResponse()
    const next = jest.fn()

    await authMiddleware(req, res, next)

    expect(mockedVerifyToken).toHaveBeenCalledWith('cookie.token')
    expect(next).toHaveBeenCalledTimes(1)
  })

  it('normalizes legacy client tokens that only have type=client', async () => {
    mockedVerifyToken.mockReturnValue({
      userId: 'client-1',
      email: 'client@test.com',
      type: 'client'
    })

    const req = {
      headers: {
        authorization: 'Bearer token'
      }
    } as any
    const res = createResponse()
    const next = jest.fn()

    await authMiddleware(req, res, next)

    expect(req.user.userType).toBe('client')
    expect(next).toHaveBeenCalledTimes(1)
  })

  it('normalizes legacy staff tokens based on role or salonId', async () => {
    mockedVerifyToken.mockReturnValue({
      userId: 'staff-legacy',
      email: 'legacy.staff@test.com',
      role: 'MANAGER',
      salonId: 'salon-1'
    })

    const req = {
      headers: {
        authorization: 'Bearer token'
      }
    } as any
    const res = createResponse()
    const next = jest.fn()

    await authMiddleware(req, res, next)

    expect(req.user.userType).toBe('staff')
    expect(next).toHaveBeenCalledTimes(1)
  })

  it('returns 401 when token verification fails', async () => {
    mockedVerifyToken.mockImplementation(() => {
      throw new Error('invalid')
    })

    const req = {
      headers: {
        authorization: 'Bearer invalid'
      }
    } as any
    const res = createResponse()
    const next = jest.fn()

    await authMiddleware(req, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Token invalide ou expire'
    })
  })
})
