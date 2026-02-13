# API Client pour Front Client

Ce dossier contient tous les services API pour communiquer avec le backend.

## Configuration

### Variables d'environnement

Créez un fichier `.env.local` à la racine du projet avec :

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

## Services disponibles

### 1. Auth API (`auth.api.ts`)

Gestion de l'authentification et des utilisateurs.

```typescript
import { api } from '@/lib/api';

// S'inscrire
await api.auth.register({
  username: 'johndoe',
  email: 'john@example.com',
  password: 'password123',
  firstName: 'John',
  lastName: 'Doe',
});

// Se connecter
await api.auth.login({
  email: 'john@example.com',
  password: 'password123',
});

// Récupérer l'utilisateur connecté
const { user } = await api.auth.getMe();

// Se déconnecter
await api.auth.logout();
```

### 2. Salon API (`salon.api.ts`)

Gestion des salons, horaires et jours de fermeture.

```typescript
import { api } from '@/lib/api';

// Récupérer tous les salons
const salons = await api.salons.getAllSalons();

// Récupérer un salon par slug
const salon = await api.salons.getSalonBySlug('studio-barber-championnet');

// Récupérer les horaires d'un salon
const schedules = await api.salons.getSchedules(salonId);

// Récupérer les jours de fermeture
const closedDays = await api.salons.getClosedDays(salonId);

// Créer un salon (authentification requise)
const newSalon = await api.salons.createSalon({
  name: 'Mon Salon',
  address: '123 Rue Example',
  city: 'Grenoble',
  postalCode: '38000',
  phone: '0476123456',
});
```

### 3. Service API (`service.api.ts`)

Gestion des services/prestations.

```typescript
import { api } from '@/lib/api';

// Récupérer tous les services d'un salon
const services = await api.services.getServicesBySalon(salonId);

// Récupérer les services groupés par catégorie
const categories = await api.services.getServicesByCategory(salonId);
// Retourne: [{ category: 'Coupes', services: [...] }, ...]

// Récupérer un service par ID
const service = await api.services.getServiceById(serviceId);
```

### 4. Staff API (`staff.api.ts`)

Gestion du personnel.

```typescript
import { api } from '@/lib/api';

// Récupérer le personnel d'un salon
const staff = await api.staff.getStaffBySalon(salonId);

// Récupérer un membre du personnel
const staffMember = await api.staff.getStaffById(staffId);

// Récupérer les horaires du personnel
const schedule = await api.staff.getStaffSchedule(staffId);
```

### 5. Booking API (`booking.api.ts`)

Gestion des réservations.

```typescript
import { api } from '@/lib/api';

// Vérifier la disponibilité
const slots = await api.bookings.checkAvailability({
  salonId: 'salon-123',
  serviceId: 'service-456',
  date: '2025-12-28',
  staffId: 'staff-789', // optionnel
});

// Créer une réservation
const booking = await api.bookings.createBooking({
  salonId: 'salon-123',
  staffId: 'staff-789',
  serviceId: 'service-456',
  date: '2025-12-28',
  startTime: '14:00',
  clientInfo: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '0612345678',
  },
  notes: 'Note optionnelle',
});

// Récupérer les réservations d'un salon
const bookings = await api.bookings.getBookingsBySalon(salonId, {
  date: '2025-12-28',
  status: 'CONFIRMED',
});

// Annuler une réservation
await api.bookings.cancelBooking(bookingId);
```

## Utilisation dans les composants

### Exemple avec React Hooks

```typescript
'use client';

import { useEffect, useState } from 'react';
import { api, Salon } from '@/lib/api';

export default function SalonsList() {
  const [salons, setSalons] = useState<Salon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSalons() {
      try {
        setLoading(true);
        const data = await api.salons.getAllSalons();
        setSalons(data);
      } catch (err: any) {
        setError(err.message || 'Erreur lors du chargement des salons');
      } finally {
        setLoading(false);
      }
    }

    fetchSalons();
  }, []);

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error}</div>;

  return (
    <div>
      {salons.map((salon) => (
        <div key={salon.id}>
          <h3>{salon.name}</h3>
          <p>{salon.address}</p>
        </div>
      ))}
    </div>
  );
}
```

### Exemple avec Server Actions (Next.js 14+)

```typescript
// app/actions/salons.ts
'use server';

import { api } from '@/lib/api';

export async function getSalons() {
  try {
    const salons = await api.salons.getAllSalons();
    return { success: true, data: salons };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
```

## Gestion des erreurs

Toutes les fonctions API peuvent lever une `ApiError` :

```typescript
import { api, ApiError } from '@/lib/api';

try {
  await api.auth.login({ email, password });
} catch (error) {
  if (error instanceof ApiError) {
    console.error('Status:', error.status);
    console.error('Message:', error.message);
    console.error('Data:', error.data);
  }
}
```

## Authentification

Le token JWT est automatiquement stocké dans le localStorage et ajouté aux headers de toutes les requêtes protégées.

```typescript
import { getAuthToken, setAuthToken, removeAuthToken } from '@/lib/api';

// Récupérer le token
const token = getAuthToken();

// Définir le token manuellement
setAuthToken('mon-token-jwt');

// Supprimer le token
removeAuthToken();
```

## Structure des réponses

Toutes les réponses de l'API suivent ce format :

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

## Backend

Le backend doit être démarré sur `http://localhost:5000` :

```bash
cd backend_fresha
npm run dev
```

## Next.js Frontend

Le frontend Next.js tourne sur `http://localhost:3000` :

```bash
cd front_client/front_client_sb
npm run dev
```
