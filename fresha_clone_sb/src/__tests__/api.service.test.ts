import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockRequestInterceptorUse = vi.fn()
const mockResponseInterceptorUse = vi.fn()
const mockAxiosInstance = {
  interceptors: {
    request: {
      use: mockRequestInterceptorUse,
    },
    response: {
      use: mockResponseInterceptorUse,
    },
  },
}
const mockAxiosCreate = vi.fn(() => mockAxiosInstance)

vi.mock('axios', async () => {
  const actual = await vi.importActual<typeof import('axios')>('axios')

  return {
    ...actual,
    default: {
      ...actual.default,
      create: mockAxiosCreate,
    },
    create: mockAxiosCreate,
  }
})

describe('services/api axios interceptor', () => {
  const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem')
  const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent')

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()
    window.history.replaceState({}, '', '/dashboard')

    await import('../services/api')
  })

  it('adds JSON content type for write requests with a body', () => {
    const requestHandler = mockRequestInterceptorUse.mock.calls[0][0]

    const result = requestHandler({
      method: 'post',
      data: { name: 'Test' },
      headers: {},
    })

    expect(result.headers.get('Content-Type')).toBe('application/json')
  })

  it('does not force JSON content type for GET requests', () => {
    const requestHandler = mockRequestInterceptorUse.mock.calls[0][0]

    const result = requestHandler({
      method: 'get',
      headers: {},
    })

    expect(result.headers).toEqual({})
  })

  it('clears auth storage on 401 for non-auth requests outside auth pages', async () => {
    const rejectHandler = mockResponseInterceptorUse.mock.calls[0][1]
    const error = {
      response: { status: 401 },
      config: { url: '/bookings', headers: {} },
    }

    await expect(rejectHandler(error)).rejects.toBe(error)

    expect(removeItemSpy).toHaveBeenCalledWith('userType')
    expect(dispatchEventSpy).toHaveBeenCalledTimes(1)
  })

  it('does not clear auth storage for auth endpoints', async () => {
    const rejectHandler = mockResponseInterceptorUse.mock.calls[0][1]
    const error = {
      response: { status: 401 },
      config: { url: '/auth/login', headers: {} },
    }

    await expect(rejectHandler(error)).rejects.toBe(error)

    expect(removeItemSpy).not.toHaveBeenCalled()
    expect(dispatchEventSpy).not.toHaveBeenCalled()
  })

  it('does not clear auth storage when already on auth pages', async () => {
    window.history.replaceState({}, '', '/signin')
    vi.resetModules()
    await import('../services/api')

    const rejectHandler = mockResponseInterceptorUse.mock.calls[0][1]
    const error = {
      response: { status: 401 },
      config: { url: '/bookings', headers: {} },
    }

    await expect(rejectHandler(error)).rejects.toBe(error)

    expect(removeItemSpy).not.toHaveBeenCalled()
    expect(dispatchEventSpy).not.toHaveBeenCalled()
  })

  it('does not clear auth storage when redirect is explicitly skipped', async () => {
    const rejectHandler = mockResponseInterceptorUse.mock.calls[0][1]
    const error = {
      response: { status: 401 },
      config: {
        url: '/bookings',
        headers: { 'X-Skip-Auth-Redirect': 'true' },
      },
    }

    await expect(rejectHandler(error)).rejects.toBe(error)

    expect(removeItemSpy).not.toHaveBeenCalled()
    expect(dispatchEventSpy).not.toHaveBeenCalled()
  })

  it('ignores non-401 errors', async () => {
    const rejectHandler = mockResponseInterceptorUse.mock.calls[0][1]
    const error = {
      response: { status: 500 },
      config: { url: '/bookings', headers: {} },
    }

    await expect(rejectHandler(error)).rejects.toBe(error)
    expect(removeItemSpy).not.toHaveBeenCalled()
    expect(dispatchEventSpy).not.toHaveBeenCalled()
  })
})
