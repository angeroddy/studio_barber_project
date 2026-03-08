import { getSalonByIdentifier, getSalonClosedDaysByIdentifier } from '../api/salonLookup'
import { api } from '../api/index'
import { resolveSalonId } from '../api/salon-id.util'

vi.mock('../api/index', () => ({
  api: {
    salons: {
      getSalonById: vi.fn(),
      getSalonBySlug: vi.fn(),
      getSchedules: vi.fn(),
    },
  },
}))

vi.mock('../api/salon-id.util', () => ({
  resolveSalonId: vi.fn(),
}))

describe('lib/api/salonLookup', () => {
  const mockedSalonsApi = api.salons as unknown as {
    getSalonById: ReturnType<typeof vi.fn>
    getSalonBySlug: ReturnType<typeof vi.fn>
    getSchedules: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns salon by id when direct lookup succeeds', async () => {
    const salon = { id: 'salon-1', name: 'Studio Barber Championnet' }
    mockedSalonsApi.getSalonById.mockResolvedValue(salon)

    await expect(getSalonByIdentifier('salon-1')).resolves.toEqual(salon)
    expect(mockedSalonsApi.getSalonById).toHaveBeenCalledWith('salon-1')
    expect(mockedSalonsApi.getSalonBySlug).not.toHaveBeenCalled()
  })

  it('falls back to slug lookup when id lookup fails', async () => {
    const salon = { id: 'salon-1', name: 'Studio Barber Championnet' }
    mockedSalonsApi.getSalonById.mockRejectedValue(new Error('Not found'))
    mockedSalonsApi.getSalonBySlug.mockResolvedValue(salon)

    await expect(getSalonByIdentifier('championnet')).resolves.toEqual(salon)
    expect(mockedSalonsApi.getSalonBySlug).toHaveBeenCalledWith('championnet')
  })

  it('returns unique sorted closed days from schedules', async () => {
    vi.mocked(resolveSalonId).mockResolvedValue('salon-1')
    mockedSalonsApi.getSchedules.mockResolvedValue([
      { dayOfWeek: 5, isClosed: true },
      { dayOfWeek: 0, isClosed: true },
      { dayOfWeek: 5, isClosed: true },
      { dayOfWeek: 2, isClosed: false },
    ])

    await expect(getSalonClosedDaysByIdentifier('championnet')).resolves.toEqual([0, 5])
    expect(resolveSalonId).toHaveBeenCalledWith('championnet')
    expect(mockedSalonsApi.getSchedules).toHaveBeenCalledWith('salon-1')
  })

  it('returns an empty array when closed day lookup fails', async () => {
    vi.mocked(resolveSalonId).mockRejectedValue(new Error('boom'))

    await expect(getSalonClosedDaysByIdentifier('championnet')).resolves.toEqual([])
  })
})
