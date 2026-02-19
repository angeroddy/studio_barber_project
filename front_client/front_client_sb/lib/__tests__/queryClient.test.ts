import { QueryClient } from '@tanstack/react-query'

describe('lib/queryClient', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllGlobals()
  })

  it('creates query client with expected default options', async () => {
    const { makeQueryClient } = await import('../queryClient')
    const client = makeQueryClient()
    const defaults = client.getDefaultOptions()

    expect(client).toBeInstanceOf(QueryClient)
    expect(defaults.queries?.staleTime).toBe(1000 * 60 * 5)
    expect(defaults.queries?.gcTime).toBe(1000 * 60 * 10)
    expect(defaults.queries?.retry).toBe(1)
    expect(defaults.queries?.refetchOnWindowFocus).toBe(false)
    expect(defaults.mutations?.retry).toBe(0)
  })

  it('memoizes query client in browser context', async () => {
    const { getQueryClient } = await import('../queryClient')

    const firstClient = getQueryClient()
    const secondClient = getQueryClient()

    expect(firstClient).toBe(secondClient)
  })

  it('creates a new query client for each server-side call', async () => {
    vi.stubGlobal('window', undefined)
    const { getQueryClient } = await import('../queryClient')

    const firstClient = getQueryClient()
    const secondClient = getQueryClient()

    expect(firstClient).not.toBe(secondClient)
  })
})
