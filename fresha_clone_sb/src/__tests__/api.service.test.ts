import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockInterceptorUse = vi.fn()
const mockAxiosInstance = {
  interceptors: {
    response: {
      use: mockInterceptorUse
    }
  }
}
const mockAxiosCreate = vi.fn(() => mockAxiosInstance)

vi.mock('axios', () => ({
  default: {
    create: mockAxiosCreate
  },
  create: mockAxiosCreate
}))

describe('services/api axios interceptor', () => {
  const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem')

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()
    window.history.replaceState({}, '', '/dashboard')

    await import('../services/api')
  })

  it('clears auth storage on 401 for non-auth requests outside auth pages', async () => {
    const rejectHandler = mockInterceptorUse.mock.calls[0][1]
    const error = {
      response: { status: 401 },
      config: { url: '/bookings' }
    }

    await expect(rejectHandler(error)).rejects.toBe(error)

    expect(removeItemSpy).toHaveBeenCalledWith('user')
    expect(removeItemSpy).toHaveBeenCalledWith('userType')
  })

  it('does not clear auth storage for auth endpoints', async () => {
    const rejectHandler = mockInterceptorUse.mock.calls[0][1]
    const error = {
      response: { status: 401 },
      config: { url: '/auth/login' }
    }

    await expect(rejectHandler(error)).rejects.toBe(error)

    expect(removeItemSpy).not.toHaveBeenCalled()
  })

  it('does not clear auth storage when already on auth pages', async () => {
    window.history.replaceState({}, '', '/signin')
    vi.resetModules()
    await import('../services/api')

    const rejectHandler = mockInterceptorUse.mock.calls[0][1]
    const error = {
      response: { status: 401 },
      config: { url: '/bookings' }
    }

    await expect(rejectHandler(error)).rejects.toBe(error)

    expect(removeItemSpy).not.toHaveBeenCalled()
  })

  it('ignores non-401 errors', async () => {
    const rejectHandler = mockInterceptorUse.mock.calls[0][1]
    const error = {
      response: { status: 500 },
      config: { url: '/bookings' }
    }

    await expect(rejectHandler(error)).rejects.toBe(error)
    expect(removeItemSpy).not.toHaveBeenCalled()
  })
})
