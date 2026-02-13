import { useState, useCallback, ChangeEvent, FormEvent } from 'react'

export interface UseFormConfig<T> {
  initialValues: T
  onSubmit: (values: T) => Promise<void> | void
  validate?: (values: T) => Record<keyof T | string, string>
  resetAfterSubmit?: boolean
}

export interface UseFormReturn<T> {
  // Form state
  values: T
  errors: Partial<Record<keyof T, string>>
  touched: Partial<Record<keyof T, boolean>>
  isSubmitting: boolean
  isDirty: boolean

  // Handlers
  handleChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
  handleBlur: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
  handleSubmit: (e: FormEvent<HTMLFormElement>) => Promise<void>
  setFieldValue: (field: keyof T, value: any) => void
  setFieldError: (field: keyof T, error: string) => void
  setFieldTouched: (field: keyof T, touched: boolean) => void
  setValues: (values: T) => void
  resetForm: () => void

  // Utilities
  getFieldProps: (name: keyof T) => {
    name: string
    value: any
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
    onBlur: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
  }
  isValid: boolean
}

export function useForm<T extends Record<string, any>>({
  initialValues,
  onSubmit,
  validate,
  resetAfterSubmit = false,
}: UseFormConfig<T>): UseFormReturn<T> {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({})
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDirty, setIsDirty] = useState(false)

  // Handle input change
  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target

    let finalValue: any = value

    // Handle checkbox
    if (type === 'checkbox') {
      finalValue = (e.target as HTMLInputElement).checked
    }

    // Handle number input
    if (type === 'number') {
      finalValue = value === '' ? '' : Number(value)
    }

    setValues(prev => ({ ...prev, [name]: finalValue }))
    setIsDirty(true)

    // Clear error when user starts typing
    if (errors[name as keyof T]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }, [errors])

  // Handle input blur
  const handleBlur = useCallback((e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name } = e.target
    setTouched(prev => ({ ...prev, [name]: true }))

    // Validate field on blur if validate function provided
    if (validate) {
      const validationErrors = validate(values)
      if (validationErrors[name as keyof T]) {
        setErrors(prev => ({ ...prev, [name]: validationErrors[name as keyof T] }))
      }
    }
  }, [validate, values])

  // Handle form submit
  const handleSubmit = useCallback(async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Mark all fields as touched
    const allTouched: Partial<Record<keyof T, boolean>> = {}
    Object.keys(values).forEach(key => {
      allTouched[key as keyof T] = true
    })
    setTouched(allTouched)

    // Validate all fields
    if (validate) {
      const validationErrors = validate(values)
      setErrors(validationErrors)

      // Don't submit if there are errors
      if (Object.keys(validationErrors).length > 0) {
        return
      }
    }

    // Submit form
    setIsSubmitting(true)
    try {
      await onSubmit(values)
      if (resetAfterSubmit) {
        resetForm()
      }
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }, [values, validate, onSubmit, resetAfterSubmit])

  // Set field value programmatically
  const setFieldValue = useCallback((field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }))
    setIsDirty(true)
  }, [])

  // Set field error programmatically
  const setFieldError = useCallback((field: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }))
  }, [])

  // Set field touched programmatically
  const setFieldTouched = useCallback((field: keyof T, isTouched: boolean) => {
    setTouched(prev => ({ ...prev, [field]: isTouched }))
  }, [])

  // Reset form
  const resetForm = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
    setIsDirty(false)
  }, [initialValues])

  // Get field props (spread into input)
  const getFieldProps = useCallback((name: keyof T) => ({
    name: String(name),
    value: values[name] ?? '',
    onChange: handleChange,
    onBlur: handleBlur,
  }), [values, handleChange, handleBlur])

  // Check if form is valid
  const isValid = Object.keys(errors).length === 0

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isDirty,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setFieldError,
    setFieldTouched,
    setValues,
    resetForm,
    getFieldProps,
    isValid,
  }
}
