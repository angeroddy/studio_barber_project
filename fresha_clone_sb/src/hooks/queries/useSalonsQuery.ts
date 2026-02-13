import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { salonService } from '@/services/salon.service'

// Query Keys - Centralise les clés pour éviter les erreurs de frappe
export const salonKeys = {
  all: ['salons'] as const,
  lists: () => [...salonKeys.all, 'list'] as const,
  list: (filters: string) => [...salonKeys.lists(), { filters }] as const,
  details: () => [...salonKeys.all, 'detail'] as const,
  detail: (id: string) => [...salonKeys.details(), id] as const,
  bySlug: (slug: string) => [...salonKeys.details(), 'slug', slug] as const,
}

// Hook pour récupérer tous les salons de l'utilisateur
export function useMySalons() {
  return useQuery({
    queryKey: salonKeys.lists(),
    queryFn: async () => {
      return salonService.getMySalons()
    },
  })
}

// Hook pour récupérer un salon par ID
export function useSalon(id: string | null) {
  return useQuery({
    queryKey: salonKeys.detail(id || ''),
    queryFn: async () => {
      if (!id) throw new Error('Salon ID requis')
      return salonService.getSalonById(id)
    },
    enabled: !!id, // Ne lance la requête que si l'ID existe
  })
}

// Hook pour récupérer un salon par slug
export function useSalonBySlug(slug: string | null) {
  return useQuery({
    queryKey: salonKeys.bySlug(slug || ''),
    queryFn: async () => {
      if (!slug) throw new Error('Salon slug requis')
      return salonService.getSalonBySlug(slug)
    },
    enabled: !!slug,
  })
}

// Hook pour créer un salon
export function useCreateSalon() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: any) => {
      return salonService.createSalon(data)
    },
    onSuccess: () => {
      // Invalide le cache pour forcer un rafraîchissement
      queryClient.invalidateQueries({ queryKey: salonKeys.lists() })
    },
  })
}

// Hook pour mettre à jour un salon
export function useUpdateSalon() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return salonService.updateSalon(id, data)
    },
    onSuccess: (data) => {
      // Mise à jour optimiste du cache
      queryClient.setQueryData(salonKeys.detail(data.id), data)
      queryClient.invalidateQueries({ queryKey: salonKeys.lists() })
    },
  })
}

// Hook pour supprimer un salon
export function useDeleteSalon() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await salonService.deleteSalon(id)
      return id
    },
    onSuccess: (deletedId) => {
      // Supprime du cache
      queryClient.removeQueries({ queryKey: salonKeys.detail(deletedId) })
      queryClient.invalidateQueries({ queryKey: salonKeys.lists() })
    },
  })
}
