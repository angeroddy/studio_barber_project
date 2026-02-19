import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '../services/api'
import { getProfile, login, logout, register } from '../services/auth.service'

vi.mock('../services/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn()
  }
}))

describe('auth.service', () => {
  const mockedApi = api as unknown as {
    post: ReturnType<typeof vi.fn>
    get: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('registers a user via /auth/register', async () => {
    const payload = {
      email: 'owner@test.com',
      password: 'StrongPass123!',
      firstName: 'Owner',
      lastName: 'Test'
    }
    const response = { success: true, message: 'ok', data: { user: { id: '1' }, token: 'abc' } }
    mockedApi.post.mockResolvedValue({ data: response })

    const result = await register(payload)

    expect(mockedApi.post).toHaveBeenCalledWith('/auth/register', payload)
    expect(result).toEqual(response)
  })

  it('logs in a user via /auth/login', async () => {
    const payload = { email: 'owner@test.com', password: 'StrongPass123!' }
    const response = { success: true, message: 'ok', data: { user: { id: '1' }, token: 'abc' } }
    mockedApi.post.mockResolvedValue({ data: response })

    const result = await login(payload)

    expect(mockedApi.post).toHaveBeenCalledWith('/auth/login', payload)
    expect(result).toEqual(response)
  })

  it('fetches profile via /auth/me', async () => {
    const response = { success: true, data: { id: '1', email: 'owner@test.com' } }
    mockedApi.get.mockResolvedValue({ data: response })

    const result = await getProfile()

    expect(mockedApi.get).toHaveBeenCalledWith('/auth/me')
    expect(result).toEqual(response)
  })

  it('logs out via /auth/logout', async () => {
    mockedApi.post.mockResolvedValue({ data: {} })

    await logout()

    expect(mockedApi.post).toHaveBeenCalledWith('/auth/logout')
  })
})
