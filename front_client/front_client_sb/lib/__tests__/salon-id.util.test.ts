import { apiRequest } from '../api/config'
import { resolveSalonId } from '../api/salon-id.util'

vi.mock('../api/config', () => ({
  apiRequest: vi.fn()
}))

describe('resolveSalonId', () => {
  const mockedApiRequest = apiRequest as unknown as ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns empty and UUID identifiers without API calls', async () => {
    await expect(resolveSalonId('')).resolves.toBe('')
    await expect(resolveSalonId('123e4567-e89b-12d3-a456-426614174000')).resolves.toBe(
      '123e4567-e89b-12d3-a456-426614174000'
    )

    expect(mockedApiRequest).not.toHaveBeenCalled()
  })

  it('resolves slug to salon id from API', async () => {
    mockedApiRequest.mockResolvedValue({
      success: true,
      data: { id: 'salon-123' }
    })

    const result = await resolveSalonId('my-salon-slug')

    expect(mockedApiRequest).toHaveBeenCalledWith('/salons/slug/my-salon-slug')
    expect(result).toBe('salon-123')
  })

  it('falls back to original identifier when lookup fails', async () => {
    mockedApiRequest.mockRejectedValue(new Error('not found'))

    const result = await resolveSalonId('unknown-slug')

    expect(result).toBe('unknown-slug')
  })
})
