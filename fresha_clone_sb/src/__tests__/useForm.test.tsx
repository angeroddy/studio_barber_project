import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useForm } from '../hooks/useForm'

interface FormValues {
  name: string
  age: number | ''
  accepted: boolean
}

describe('useForm', () => {
  const initialValues: FormValues = {
    name: '',
    age: '',
    accepted: false
  }

  it('updates values from text/number/checkbox inputs and marks form dirty', () => {
    const { result } = renderHook(() =>
      useForm<FormValues>({
        initialValues,
        onSubmit: vi.fn()
      })
    )

    act(() => {
      result.current.handleChange({
        target: { name: 'name', value: 'Alice', type: 'text' }
      } as any)
    })
    expect(result.current.values.name).toBe('Alice')
    expect(result.current.isDirty).toBe(true)

    act(() => {
      result.current.handleChange({
        target: { name: 'age', value: '42', type: 'number' }
      } as any)
    })
    expect(result.current.values.age).toBe(42)

    act(() => {
      result.current.handleChange({
        target: { name: 'accepted', type: 'checkbox', checked: true, value: 'on' }
      } as any)
    })
    expect(result.current.values.accepted).toBe(true)
  })

  it('marks field as touched and applies validation errors on blur', () => {
    const validate = vi.fn((values: FormValues) => {
      const errors: Record<string, string> = {}
      if (!values.name) errors.name = 'Le nom est requis'
      return errors
    })

    const { result } = renderHook(() =>
      useForm<FormValues>({
        initialValues,
        onSubmit: vi.fn(),
        validate
      })
    )

    act(() => {
      result.current.handleBlur({
        target: { name: 'name' }
      } as any)
    })

    expect(result.current.touched.name).toBe(true)
    expect(result.current.errors.name).toBe('Le nom est requis')
  })

  it('does not submit when validation fails', async () => {
    const onSubmit = vi.fn()
    const validate = vi.fn(() => ({ name: 'Le nom est requis' }))

    const { result } = renderHook(() =>
      useForm<FormValues>({
        initialValues,
        onSubmit,
        validate
      })
    )

    const preventDefault = vi.fn()
    await act(async () => {
      await result.current.handleSubmit({ preventDefault } as any)
    })

    expect(preventDefault).toHaveBeenCalled()
    expect(onSubmit).not.toHaveBeenCalled()
    expect(result.current.errors.name).toBe('Le nom est requis')
  })

  it('submits valid values and resets form when resetAfterSubmit is enabled', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    const validate = vi.fn(() => ({}))

    const { result } = renderHook(() =>
      useForm<FormValues>({
        initialValues,
        onSubmit,
        validate,
        resetAfterSubmit: true
      })
    )

    act(() => {
      result.current.setFieldValue('name', 'Nina')
      result.current.setFieldValue('age', 29)
      result.current.setFieldValue('accepted', true)
    })

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as any)
    })

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: 'Nina',
        age: 29,
        accepted: true
      })
    })

    expect(result.current.values).toEqual(initialValues)
    expect(result.current.isDirty).toBe(false)
    expect(result.current.isSubmitting).toBe(false)
  })
})
