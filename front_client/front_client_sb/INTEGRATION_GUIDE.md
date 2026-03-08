# Guide d'intégration Backend - Frontend

Ce guide explique comment connecter le frontend Next.js au backend Express.

## 📋 Prérequis

- Node.js installé (v18+)
- Backend démarré sur le port 5000
- Frontend Next.js sur le port 3000

## 🚀 Démarrage rapide

### 1. Démarrer le Backend

```bash
# Depuis la racine du projet
cd backend_fresha

# Installer les dépendances (si pas déjà fait)
npm install

# Démarrer le serveur en mode développement
npm run dev
```

Le backend sera accessible sur `http://localhost:5000`

### 2. Démarrer le Frontend

```bash
# Depuis la racine du projet
cd front_client/front_client_sb

# Installer les dépendances (si pas déjà fait)
npm install

# Démarrer le serveur Next.js
npm run dev
```

Le frontend sera accessible sur `http://localhost:3000`

### 3. Vérifier la connexion

- Backend: `http://localhost:5000/health`
- Frontend: `http://localhost:3000`

## 📁 Structure des fichiers API

```
front_client/front_client_sb/
├── .env.local                    # Variables d'environnement
└── lib/
    └── api/
        ├── index.ts              # Point d'entrée principal
        ├── config.ts             # Configuration et helpers
        ├── auth.api.ts           # API authentification
        ├── salon.api.ts          # API salons
        ├── service.api.ts        # API services/prestations
        ├── staff.api.ts          # API personnel
        ├── booking.api.ts        # API réservations
        └── README.md             # Documentation détaillée
```

## 🔧 Configuration

### Variables d'environnement (.env.local)

Le fichier `.env.local` a été créé avec :

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

### Backend CORS

Le backend a été configuré pour accepter les requêtes depuis Next.js :

```typescript
// backend_fresha/src/app.ts
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}))
```

## 📚 Utilisation des API

### Exemple 1 : Récupérer les salons

```typescript
'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api/index';

export default function SalonsPage() {
  const [salons, setSalons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSalons() {
      try {
        const data = await api.salons.getAllSalons();
        setSalons(data);
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchSalons();
  }, []);

  return (
    <div>
      {loading ? (
        <p>Chargement...</p>
      ) : (
        salons.map(salon => (
          <div key={salon.id}>{salon.name}</div>
        ))
      )}
    </div>
  );
}
```

### Exemple 2 : Authentification

```typescript
'use client';

import { api } from '@/lib/api/index';

export default function LoginPage() {
  async function handleLogin(email: string, password: string) {
    try {
      const response = await api.auth.login({ email, password });
      console.log('Utilisateur connecté:', response.user);
      // Le token JWT est automatiquement stocké
    } catch (error) {
      console.error('Erreur de connexion:', error);
    }
  }

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      handleLogin(
        formData.get('email') as string,
        formData.get('password') as string
      );
    }}>
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      <button type="submit">Se connecter</button>
    </form>
  );
}
```

### Exemple 3 : Créer une réservation

```typescript
'use client';

import { api } from '@/lib/api/index';

export default function BookingPage() {
  async function createBooking() {
    try {
      const booking = await api.bookings.createBooking({
        salonId: 'salon-123',
        staffId: 'staff-456',
        serviceId: 'service-789',
        date: '2025-12-28',
        startTime: '14:00',
        clientInfo: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '0612345678',
        },
      });
      console.log('Réservation créée:', booking);
    } catch (error) {
      console.error('Erreur:', error);
    }
  }

  return (
    <button onClick={createBooking}>
      Créer une réservation
    </button>
  );
}
```

## 🔑 Endpoints API disponibles

### Authentification (`/api/auth`)
- `POST /auth/register` - Créer un compte
- `POST /auth/login` - Se connecter
- `GET /auth/me` - Récupérer l'utilisateur connecté (protégé)

### Salons (`/api/salons`)
- `GET /salons` - Liste des salons
- `GET /salons/:id` - Détails d'un salon
- `GET /salons/slug/:slug` - Salon par slug
- `POST /salons` - Créer un salon (protégé)
- `GET /salons/:salonId/schedules` - Horaires du salon
- `GET /salons/:salonId/closed-days` - Jours de fermeture

### Services (`/api/services`)
- `GET /services` - Liste des services
- `GET /services/:id` - Détails d'un service
- `POST /services` - Créer un service (protégé)

### Personnel (`/api/staff`)
- `GET /staff` - Liste du personnel
- `GET /staff/:id` - Détails d'un membre
- `POST /staff` - Ajouter un membre (protégé)

### Réservations (`/api/bookings`)
- `POST /bookings` - Créer une réservation
- `GET /bookings/:id` - Détails d'une réservation
- `GET /bookings/salon/:salonId` - Réservations d'un salon
- `POST /bookings/check-availability` - Vérifier la disponibilité
- `PATCH /bookings/:id/status` - Changer le statut

## 🎯 Composants déjà intégrés

### Page de sélection du salon (`app/reserver/page.tsx`)

Cette page a été mise à jour pour :
- ✅ Charger les salons depuis l'API
- ✅ Afficher un état de chargement
- ✅ Gérer les erreurs avec fallback sur données de démonstration
- ✅ Afficher un message si la connexion échoue

## 🛠️ Prochaines étapes

Pour continuer l'intégration :

1. **Page des prestations** (`app/reserver/prestations/page.tsx`)
   - Charger les services depuis l'API avec `api.services.getServicesBySalon(salonId)`

2. **Page de sélection du professionnel** (`app/reserver/professionnel/page.tsx`)
   - Charger le personnel avec `api.staff.getStaffBySalon(salonId)`

3. **Page de sélection de l'heure** (`app/reserver/heure/page.tsx`)
   - Vérifier la disponibilité avec `api.bookings.checkAvailability()`
   - Créer la réservation avec `api.bookings.createBooking()`

4. **Pages de connexion/inscription** (`app/login/page.tsx`, `app/register/page.tsx`)
   - Implémenter `api.auth.login()` et `api.auth.register()`

## 🐛 Dépannage

### Erreur CORS

Si vous voyez une erreur CORS dans la console :

```
Access to fetch at 'http://localhost:5000/api/...' has been blocked by CORS policy
```

**Solution**: Vérifiez que le backend autorise l'origine `http://localhost:3000` dans `backend_fresha/src/app.ts`

### Erreur de connexion

Si l'API ne répond pas :

1. Vérifiez que le backend est démarré sur le port 5000
2. Testez manuellement : `curl http://localhost:5000/health`
3. Vérifiez les variables d'environnement dans `.env.local`

### Erreur d'import TypeScript

Si vous voyez `Cannot find module '@/lib/api/index'`:

1. Vérifiez que tous les fichiers dans `lib/api/` existent
2. Redémarrez le serveur Next.js : `npm run dev`

## 📖 Documentation complète

Pour plus de détails, consultez :
- [lib/api/README.md](lib/api/README.md) - Documentation complète des API
- Documentation du backend : `backend_fresha/src/`

## 🎉 Félicitations !

Votre frontend Next.js est maintenant connecté au backend Express ! Vous pouvez commencer à utiliser toutes les fonctionnalités de l'API.
