import {
  ApiError,
  apiRequest,
  getDefaultHeaders,
  removeAuthToken,
  setAuthToken
} from '../api/config'

describe('lib/api/config', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.stubGlobal('fetch', vi.fn())
  })

  it('does not force JSON content-type for body-less requests', () => {
    expect(getDefaultHeaders()).toEqual({})
  })

  it('returns default JSON content-type for requests with a JSON body', () => {
    expect(
      getDefaultHeaders({
        method: 'POST',
        body: JSON.stringify({ hello: 'world' })
      })
    ).toEqual({
      'Content-Type': 'application/json'
    })
  })

  it('setAuthToken and removeAuthToken clear local storage token', () => {
    localStorage.setItem('authToken', 'value')
    setAuthToken('new-token')
    expect(localStorage.getItem('authToken')).toBeNull()

    localStorage.setItem('authToken', 'value')
    removeAuthToken()
    expect(localStorage.getItem('authToken')).toBeNull()
  })

  it('sends API request with credentials and merged headers', async () => {
    const fetchMock = global.fetch as unknown as ReturnType<typeof vi.fn>
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ success: true, data: { id: '1' } })
    })

    const result = await apiRequest('/bookings', {
      method: 'POST',
      headers: { 'X-Test': '1' },
      body: JSON.stringify({ hello: 'world' })
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:5000/api/bookings',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({ hello: 'world' }),
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'X-Test': '1'
        })
      })
    )
    expect(result).toEqual({ success: true, data: { id: '1' } })
  })

  it('throws ApiError with backend payload on non-ok response', async () => {
    const fetchMock = global.fetch as unknown as ReturnType<typeof vi.fn>
    fetchMock.mockResolvedValue({
      ok: false,
      status: 400,
      json: vi.fn().mockResolvedValue({ error: 'Bad request' })
    })

    const promise = apiRequest('/bad-request')

    await expect(promise).rejects.toBeInstanceOf(ApiError)
    await expect(promise).rejects.toMatchObject({
      message: 'Bad request',
      status: 400
    })
  })

  it('throws connection ApiError when fetch fails', async () => {
    const fetchMock = global.fetch as unknown as ReturnType<typeof vi.fn>
    fetchMock.mockRejectedValue(new Error('Network down'))

    await expect(apiRequest('/network-error')).rejects.toMatchObject({
      message: 'Erreur de connexion au serveur'
    })
  })
})
