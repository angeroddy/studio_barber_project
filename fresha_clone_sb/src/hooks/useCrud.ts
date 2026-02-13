import { useState, useCallback } from 'react'
import toast from 'react-hot-toast'

export interface CrudConfig<T, CreateData = Partial<T>, UpdateData = Partial<T>> {
  fetchAll: () => Promise<T[]>
  fetchById?: (id: string) => Promise<T>
  create: (data: CreateData) => Promise<T>
  update: (id: string, data: UpdateData) => Promise<T>
  delete: (id: string) => Promise<void>
  resourceName?: string // Pour les messages toast (ex: "salon", "staff")
}

export interface UseCrudReturn<T> {
  // State
  items: T[]
  currentItem: T | null
  loading: boolean
  error: string | null

  // Actions
  fetchAll: () => Promise<void>
  fetchById: (id: string) => Promise<void>
  create: (data: any) => Promise<T | null>
  update: (id: string, data: any) => Promise<T | null>
  remove: (id: string) => Promise<boolean>
  setCurrentItem: (item: T | null) => void
  clearError: () => void
}

export function useCrud<T extends { id: string }, CreateData = Partial<T>, UpdateData = Partial<T>>(
  config: CrudConfig<T, CreateData, UpdateData>
): UseCrudReturn<T> {
  const [items, setItems] = useState<T[]>([])
  const [currentItem, setCurrentItem] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resourceName = config.resourceName || 'élément'

  // Fetch all items
  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await config.fetchAll()
      setItems(data)
    } catch (err: any) {
      const errorMessage = err.message || `Erreur lors du chargement des ${resourceName}s`
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [config, resourceName])

  // Fetch item by ID
  const fetchById = useCallback(async (id: string) => {
    if (!config.fetchById) {
      console.warn('fetchById not configured')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const data = await config.fetchById(id)
      setCurrentItem(data)
    } catch (err: any) {
      const errorMessage = err.message || `Erreur lors du chargement du ${resourceName}`
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [config, resourceName])

  // Create item
  const create = useCallback(async (data: CreateData): Promise<T | null> => {
    setLoading(true)
    setError(null)
    try {
      const newItem = await config.create(data)
      setItems(prev => [...prev, newItem])
      toast.success(`${resourceName.charAt(0).toUpperCase() + resourceName.slice(1)} créé avec succès !`)
      return newItem
    } catch (err: any) {
      const errorMessage = err.message || `Erreur lors de la création du ${resourceName}`
      setError(errorMessage)
      toast.error(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [config, resourceName])

  // Update item
  const update = useCallback(async (id: string, data: UpdateData): Promise<T | null> => {
    setLoading(true)
    setError(null)
    try {
      const updatedItem = await config.update(id, data)
      setItems(prev => prev.map(item => item.id === id ? updatedItem : item))
      if (currentItem?.id === id) {
        setCurrentItem(updatedItem)
      }
      toast.success(`${resourceName.charAt(0).toUpperCase() + resourceName.slice(1)} modifié avec succès !`)
      return updatedItem
    } catch (err: any) {
      const errorMessage = err.message || `Erreur lors de la modification du ${resourceName}`
      setError(errorMessage)
      toast.error(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [config, resourceName, currentItem])

  // Delete item
  const remove = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true)
    setError(null)
    try {
      await config.delete(id)
      setItems(prev => prev.filter(item => item.id !== id))
      if (currentItem?.id === id) {
        setCurrentItem(null)
      }
      toast.success(`${resourceName.charAt(0).toUpperCase() + resourceName.slice(1)} supprimé avec succès !`)
      return true
    } catch (err: any) {
      const errorMessage = err.message || `Erreur lors de la suppression du ${resourceName}`
      setError(errorMessage)
      toast.error(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }, [config, resourceName, currentItem])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    items,
    currentItem,
    loading,
    error,
    fetchAll,
    fetchById,
    create,
    update,
    remove,
    setCurrentItem,
    clearError,
  }
}
