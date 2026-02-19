import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import useGoBack from '../hooks/useGoBack'

const mockNavigate = vi.fn()

vi.mock('react-router', () => ({
  useNavigate: () => mockNavigate
}))

describe('useGoBack', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('navigates back when browser history has previous entries', () => {
    window.history.pushState({ idx: 1 }, '', '/dashboard')

    const { result } = renderHook(() => useGoBack())

    act(() => {
      result.current()
    })

    expect(mockNavigate).toHaveBeenCalledWith(-1)
  })

  it('redirects to home when there is no previous history entry', () => {
    window.history.replaceState({ idx: 0 }, '', '/current')

    const { result } = renderHook(() => useGoBack())

    act(() => {
      result.current()
    })

    expect(mockNavigate).toHaveBeenCalledWith('/')
  })
})
