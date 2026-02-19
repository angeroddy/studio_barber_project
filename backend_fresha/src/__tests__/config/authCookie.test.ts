import type { Response } from 'express'
import { clearAuthCookie, getAuthCookieName, setAuthCookie } from '../../config/authCookie'

describe('authCookie config', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  function createResponseMock() {
    return {
      cookie: jest.fn(),
      clearCookie: jest.fn()
    } as unknown as Response
  }

  it('uses secure defaults for auth cookie options', () => {
    delete process.env.AUTH_COOKIE_NAME
    delete process.env.AUTH_COOKIE_SAME_SITE
    delete process.env.AUTH_COOKIE_SECURE
    delete process.env.AUTH_COOKIE_MAX_AGE_MS
    process.env.NODE_ENV = 'test'

    const res = createResponseMock()
    setAuthCookie(res, 'token-123')

    expect((res.cookie as jest.Mock)).toHaveBeenCalledWith(
      'auth_token',
      'token-123',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000
      })
    )
  })

  it('respects cookie environment overrides', () => {
    process.env.AUTH_COOKIE_NAME = 'session_auth'
    process.env.AUTH_COOKIE_SAME_SITE = 'none'
    delete process.env.AUTH_COOKIE_SECURE
    process.env.AUTH_COOKIE_MAX_AGE_MS = '60000'
    process.env.NODE_ENV = 'development'

    const res = createResponseMock()
    setAuthCookie(res, 'token-xyz')

    expect((res.cookie as jest.Mock)).toHaveBeenCalledWith(
      'session_auth',
      'token-xyz',
      expect.objectContaining({
        sameSite: 'none',
        secure: true,
        maxAge: 60000
      })
    )
  })

  it('supports explicit AUTH_COOKIE_SECURE override', () => {
    process.env.AUTH_COOKIE_SECURE = 'true'

    const res = createResponseMock()
    setAuthCookie(res, 'token-secure')

    expect((res.cookie as jest.Mock).mock.calls[0][2].secure).toBe(true)
  })

  it('clears auth cookie with matching options and no maxAge', () => {
    process.env.AUTH_COOKIE_NAME = 'auth_cookie_custom'
    process.env.AUTH_COOKIE_SAME_SITE = 'strict'

    const res = createResponseMock()
    clearAuthCookie(res)

    expect((res.clearCookie as jest.Mock)).toHaveBeenCalledWith(
      'auth_cookie_custom',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'strict',
        path: '/'
      })
    )
    expect((res.clearCookie as jest.Mock).mock.calls[0][1]).not.toHaveProperty('maxAge')
  })

  it('returns configured cookie name', () => {
    process.env.AUTH_COOKIE_NAME = 'my_cookie_name'
    expect(getAuthCookieName()).toBe('my_cookie_name')
  })
})
