# Test des Endpoints API

## Route GET /api/salons

Cette route récupère tous les salons disponibles.

### Test avec curl

```bash
curl http://localhost:5000/api/salons
```

### Test avec le navigateur

Ouvrez simplement : `http://localhost:5000/api/salons`

### Réponse attendue

```json
{
  "success": true,
  "salons": [
    {
      "id": "...",
      "name": "Studio Barber Championnet",
      "slug": "studio-barber-championnet",
      "address": "42 Rue Lesdiguieres",
      "city": "Grenoble",
      "zipCode": "38000",
      "phone": "0476123456",
      "email": "championnet@studiobarber.fr",
      "ownerId": "...",
      "createdAt": "...",
      "updatedAt": "...",
      "owner": {
        "id": "...",
        "email": "...",
        "firstName": "...",
        "lastName": "..."
      },
      "_count": {
        "services": 5,
        "staff": 3,
        "clients": 10,
        "bookings": 20
      }
    }
  ],
  "count": 2
}
```

## Modifications apportées

### 1. Service Layer (`src/services/salon.service.ts`)

Ajout de la fonction `getAllSalons()` :

```typescript
export async function getAllSalons() {
  const salons = await prisma.salon.findMany({
    include: {
      owner: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true
        }
      },
      _count: {
        select: {
          services: true,
          staff: true,
          clients: true,
          bookings: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return salons
}
```

### 2. Controller Layer (`src/controllers/salon.controller.ts`)

Ajout du handler `getAllSalonsHandler()` :

```typescript
export async function getAllSalonsHandler(req: Request, res: Response) {
  try {
    const salons = await getAllSalons()

    res.json({
      success: true,
      salons: salons,
      count: salons.length
    })

  } catch (error: any) {
    console.error('Erreur récupération salons:', error)
    res.status(400).json({
      success: false,
      error: error.message
    })
  }
}
```

### 3. Routes Layer (`src/routes/salon.routes.ts`)

Ajout de la route GET `/api/salons` :

```typescript
router.get('/', getAllSalonsHandler)
```

## Redémarrage du backend

Pour que les modifications prennent effet :

```bash
# Arrêter le serveur (Ctrl+C)
# Redémarrer
cd backend_fresha
npm run dev
```

## Test depuis le frontend

Une fois le backend redémarré, ouvrez le frontend :

```bash
cd front_client/front_client_sb
npm run dev
```

Naviguez vers `http://localhost:3000/reserver` et vérifiez que les salons s'affichent correctement.

## Vérification de la base de données

Si aucun salon ne s'affiche, vérifiez que la base de données contient des salons :

```bash
cd backend_fresha
npm run seed
```

Cela va créer des données de test si nécessaire.
