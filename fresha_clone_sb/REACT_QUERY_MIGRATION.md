# Guide de Migration vers React Query

React Query est maintenant configuré dans l'application. Ce guide explique comment migrer les hooks existants.

## Configuration

- **QueryClient** : Configuré dans `src/lib/queryClient.ts`
- **Provider** : Ajouté dans `src/main.tsx`
- **DevTools** : Disponibles en développement (icône en bas à gauche)

## Exemple : useSalons → useSalonsQuery

### Avant (useState + useEffect)

```typescript
// src/hooks/useSalons.ts
export const useSalons = () => {
  const [salons, setSalons] = useState<Salon[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMySalons = useCallback(async () => {
    setLoading(true);
    try {
      const response = await salonService.getMySalons();
      setSalons(response.salons);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMySalons();
  }, [fetchMySalons]);

  return { salons, loading, error, fetchMySalons };
};
```

### Après (React Query)

```typescript
// src/hooks/queries/useSalonsQuery.ts
import { useQuery } from '@tanstack/react-query'

export const salonKeys = {
  all: ['salons'] as const,
  lists: () => [...salonKeys.all, 'list'] as const,
}

export function useMySalons() {
  return useQuery({
    queryKey: salonKeys.lists(),
    queryFn: async () => {
      const response = await salonService.getMySalons()
      return response.salons
    },
  })
}
```

### Utilisation dans un composant

```typescript
// Avant
const { salons, loading, error } = useSalons()

// Après
const { data: salons, isLoading, error } = useMySalons()
```

## Avantages de React Query

✅ **Cache automatique** : Les données sont mises en cache et réutilisées
✅ **Rafraîchissement en arrière-plan** : Données toujours à jour
✅ **Déduplication** : Pas de requêtes multiples pour les mêmes données
✅ **Optimistic updates** : Mise à jour instantanée de l'UI
✅ **Retry automatique** : Réessai en cas d'échec
✅ **DevTools** : Debugging facile
✅ **Moins de code** : Plus besoin de useState/useEffect

## Hooks à migrer

- [ ] `useSalons.ts` → `queries/useSalonsQuery.ts` ✅ (exemple créé)
- [ ] `useDashboardMetrics.ts` → `queries/useDashboardQuery.ts`
- [ ] `usePopularServices.ts` → `queries/useServicesQuery.ts`
- [ ] Hooks inline dans les composants CRUD

## Pattern recommandé

```typescript
// 1. Définir les query keys
export const resourceKeys = {
  all: ['resource'] as const,
  lists: () => [...resourceKeys.all, 'list'] as const,
  detail: (id: string) => [...resourceKeys.all, 'detail', id] as const,
}

// 2. Hook pour lister
export function useResources() {
  return useQuery({
    queryKey: resourceKeys.lists(),
    queryFn: () => api.getAll(),
  })
}

// 3. Hook pour créer
export function useCreateResource() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data) => api.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: resourceKeys.lists() })
    },
  })
}
```

## Ressources

- [React Query Docs](https://tanstack.com/query/latest)
- [Query Keys Best Practices](https://tkdodo.eu/blog/effective-react-query-keys)
