import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useModal } from '../hooks/useModal'

describe('useModal', () => {
  it('starts closed by default and toggles state', () => {
    const { result } = renderHook(() => useModal())

    expect(result.current.isOpen).toBe(false)

    act(() => {
      result.current.openModal()
    })
    expect(result.current.isOpen).toBe(true)

    act(() => {
      result.current.toggleModal()
    })
    expect(result.current.isOpen).toBe(false)

    act(() => {
      result.current.closeModal()
    })
    expect(result.current.isOpen).toBe(false)
  })

  it('supports a custom initial state', () => {
    const { result } = renderHook(() => useModal(true))
    expect(result.current.isOpen).toBe(true)
  })
})
