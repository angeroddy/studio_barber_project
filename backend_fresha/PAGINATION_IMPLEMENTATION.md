# Guide d'Implémentation de la Pagination

## Utilitaire de Pagination

Un utilitaire réutilisable a été créé dans `src/utils/pagination.util.ts` pour standardiser la pagination.

### Fonctions disponibles

```typescript
// Calculer les paramètres de pagination
getPaginationParams(page?, limit?, defaultPage = 1, defaultLimit = 20, maxLimit = 100)
// Retourne: { page, limit, skip, take }

// Créer une réponse paginée
createPaginatedResponse(data, total, page, limit)
// Retourne: { data, pagination: { total, page, limit, totalPages } }
```

## Services avec Pagination Implémentée

### ✅ Bookings (booking.service.ts)
- `getBookingsBySalon(salonId, filters)` - Accepte `page` et `limit` dans filters
- `getBookingsByStaff(staffId, filters)` - Accepte `page` et `limit` dans filters

### ✅ Salons (salon.service.ts)
- `getAllSalons(page?, limit?)` - Pagination complète
- `getSalonsByOwner(ownerId, page?, limit?)` - Pagination complète

### ✅ Services (crudService.service.ts)
- `getServicesBySalon(salonId, activeOnly, page?, limit?)` - Pagination complète
- `getServicesByCategory(salonId, category, page?, limit?)` - Pagination complète

### ✅ Staff (staff.service.ts)
- `getStaffBySalon(salonId, activeOnly, page?, limit?)` - Pagination complète
- `getStaffByRole(salonId, role, page?, limit?)` - Pagination complète

### ✅ Absences (absence.service.ts)
- `getAbsences(filters)` - Accepte `page` et `limit` dans filters

### ✅ Closed Days (closedDay.service.ts)
- `getClosedDaysBySalon(salonId, fromDate?, page?, limit?)` - Pagination complète

## Format de Réponse Standardisé

Tous les endpoints paginés retournent maintenant :

```json
{
  "data": [...],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

## ⚠️ Controllers à Mettre à Jour

Les controllers correspondants doivent être mis à jour pour :
1. Accepter les paramètres `page` et `limit` depuis les query params
2. Retourner le nouveau format de réponse paginée

### Exemple de mise à jour d'un controller

**Avant :**
```typescript
const bookings = await getBookingsBySalon(salonId, filters)
res.json({ success: true, data: bookings, count: bookings.length })
```

**Après :**
```typescript
const result = await getBookingsBySalon(salonId, {
  ...filters,
  page: Number(req.query.page),
  limit: Number(req.query.limit)
})
res.json({ success: true, ...result })
```

## Endpoints Restants (Non Paginés)

### Clients
- `getClientsByPhone()` - Peut bénéficier de pagination
- `getClientsBySalon()` - Peut bénéficier de pagination

### Staff Bookings
- `getSalonBookings()` - Peut bénéficier de pagination

## Utilisation Frontend

```typescript
// Exemple avec React Query
const { data } = useQuery({
  queryKey: ['bookings', { salonId, page, limit }],
  queryFn: async () => {
    const response = await fetch(
      `/api/salons/${salonId}/bookings?page=${page}&limit=${limit}`
    )
    return response.json()
  }
})

// Accès aux données
data.data // Les bookings
data.pagination.total // Nombre total
data.pagination.totalPages // Nombre de pages
```

## Configuration par Défaut

- **Page par défaut :** 1
- **Limite par défaut :** 20 items
- **Limite maximale :** 100 items

## Optimisations N+1 Résolues

En plus de la pagination, les requêtes N+1 suivantes ont été optimisées :

1. **booking.service.ts - getAvailableSlots()**
   - Avant : N+1 requêtes (1 par staff member)
   - Après : 1 seule requête batch pour tous les bookings

2. **booking.service.ts - createBooking()**
   - Avant : 3 requêtes séquentielles de validation
   - Après : 1 requête parallèle avec Promise.all

## Prochaines Étapes

1. Mettre à jour tous les controllers pour accepter les paramètres de pagination
2. Tester les endpoints avec différentes valeurs de page/limit
3. Ajouter la pagination aux endpoints clients restants
4. Mettre à jour la documentation API (Swagger/OpenAPI)
