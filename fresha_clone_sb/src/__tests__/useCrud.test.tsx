import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import toast from 'react-hot-toast'
import { useCrud } from '../hooks/useCrud'

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

interface TestItem {
  id: string
  name: string
}

function createConfig(overrides: Partial<{
  fetchAll: () => Promise<TestItem[]>
  fetchById: (id: string) => Promise<TestItem>
  create: (data: Partial<TestItem>) => Promise<TestItem>
  update: (id: string, data: Partial<TestItem>) => Promise<TestItem>
  delete: (id: string) => Promise<void>
}> = {}) {
  return {
    fetchAll: vi.fn().mockResolvedValue([]),
    fetchById: vi.fn().mockResolvedValue({ id: '1', name: 'One' }),
    create: vi.fn().mockImplementation(async (data: Partial<TestItem>) => ({
      id: 'new',
      name: data.name || 'New'
    })),
    update: vi.fn().mockImplementation(async (id: string, data: Partial<TestItem>) => ({
      id,
      name: data.name || 'Updated'
    })),
    delete: vi.fn().mockResolvedValue(undefined),
    resourceName: 'element',
    ...overrides
  }
}

describe('useCrud', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads items with fetchAll success path', async () => {
    const config = createConfig({
      fetchAll: vi.fn().mockResolvedValue([
        { id: '1', name: 'Alpha' },
        { id: '2', name: 'Beta' }
      ])
    })
    const { result } = renderHook(() => useCrud<TestItem>(config))

    await act(async () => {
      await result.current.fetchAll()
    })

    expect(config.fetchAll).toHaveBeenCalledTimes(1)
    expect(result.current.items).toEqual([
      { id: '1', name: 'Alpha' },
      { id: '2', name: 'Beta' }
    ])
    expect(result.current.error).toBeNull()
  })

  it('handles fetchAll errors and shows toast', async () => {
    const config = createConfig({
      fetchAll: vi.fn().mockRejectedValue(new Error('Erreur chargement'))
    })
    const { result } = renderHook(() => useCrud<TestItem>(config))

    await act(async () => {
      await result.current.fetchAll()
    })

    expect(result.current.error).toBe('Erreur chargement')
    expect(toast.error).toHaveBeenCalledWith('Erreur chargement')
  })

  it('creates, updates and removes items while maintaining local state', async () => {
    const config = createConfig({
      fetchAll: vi.fn().mockResolvedValue([{ id: '1', name: 'Initial' }]),
      create: vi.fn().mockResolvedValue({ id: '2', name: 'Created' }),
      update: vi.fn().mockResolvedValue({ id: '1', name: 'Updated' }),
      delete: vi.fn().mockResolvedValue(undefined)
    })
    const { result } = renderHook(() => useCrud<TestItem>(config))

    await act(async () => {
      await result.current.fetchAll()
    })
    expect(result.current.items).toEqual([{ id: '1', name: 'Initial' }])

    await act(async () => {
      await result.current.create({ name: 'Created' })
    })
    expect(result.current.items).toEqual([
      { id: '1', name: 'Initial' },
      { id: '2', name: 'Created' }
    ])
    expect(toast.success).toHaveBeenCalled()

    act(() => {
      result.current.setCurrentItem({ id: '1', name: 'Initial' })
    })

    await act(async () => {
      await result.current.update('1', { name: 'Updated' })
    })
    await waitFor(() => {
      expect(result.current.items).toEqual([
        { id: '1', name: 'Updated' },
        { id: '2', name: 'Created' }
      ])
      expect(result.current.currentItem).toEqual({ id: '1', name: 'Updated' })
    })

    await act(async () => {
      await result.current.remove('2')
    })
    expect(result.current.items).toEqual([{ id: '1', name: 'Updated' }])
  })

  it('returns null/false on mutation failures and stores error', async () => {
    const config = createConfig({
      create: vi.fn().mockRejectedValue(new Error('Create failed')),
      update: vi.fn().mockRejectedValue(new Error('Update failed')),
      delete: vi.fn().mockRejectedValue(new Error('Delete failed'))
    })
    const { result } = renderHook(() => useCrud<TestItem>(config))

    await act(async () => {
      const createResult = await result.current.create({ name: 'X' })
      expect(createResult).toBeNull()
    })
    expect(result.current.error).toBe('Create failed')

    await act(async () => {
      const updateResult = await result.current.update('1', { name: 'Y' })
      expect(updateResult).toBeNull()
    })
    expect(result.current.error).toBe('Update failed')

    await act(async () => {
      const deleteResult = await result.current.remove('1')
      expect(deleteResult).toBe(false)
    })
    expect(result.current.error).toBe('Delete failed')
    expect(toast.error).toHaveBeenCalled()
  })
})
