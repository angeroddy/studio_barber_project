# Guide Complet : Espace Employé - Fresha Clone

## Table des Matières
1. [Vue d'ensemble](#vue-densemble)
2. [Architecture Backend](#architecture-backend)
3. [Architecture Frontend](#architecture-frontend)
4. [Flux d'Authentification Employé](#flux-dauthentification-employé)
5. [Gestion des Absences](#gestion-des-absences)
6. [API Endpoints](#api-endpoints)
7. [Guide de Test](#guide-de-test)
8. [Prochaines Étapes](#prochaines-étapes)

---

## Vue d'ensemble

### Fonctionnalités Implémentées

#### Pour les Employés (Staff)
- **Authentification sécurisée** : Connexion avec email/mot de passe
- **Première connexion** : L'employé crée son propre mot de passe
- **Consultation des rendez-vous** :
  - Voir ses propres rendez-vous
  - Voir tous les rendez-vous du salon (collègues)
  - Mettre à jour le statut des rendez-vous
  - Ajouter des notes internes
- **Gestion des absences** :
  - Créer une demande d'absence (congé, maladie, personnel, autre)
  - Voir ses absences
  - Modifier/Supprimer ses absences en attente
  - Voir les statistiques d'absences

#### Pour les Propriétaires (Owner)
- **Tout ce qui existait avant** +
- **Gestion des absences des employés** :
  - Voir toutes les absences du salon
  - Approuver/Rejeter les demandes
  - Voir les statistiques par employé

#### Pour les Managers (Staff avec rôle MANAGER)
- Mêmes droits que les employés
- Peuvent approuver/rejeter les absences (si implémenté dans les middlewares)

---

## Architecture Backend

### 1. Modèle de Données (Prisma)

#### Modèle Absence
```prisma
model Absence {
  id         String        @id @default(uuid())
  staffId    String
  salonId    String
  type       AbsenceType   @default(OTHER)      // VACATION, SICK_LEAVE, PERSONAL, OTHER
  startDate  DateTime      @db.Date
  endDate    DateTime      @db.Date
  reason     String?
  status     AbsenceStatus @default(PENDING)    // PENDING, APPROVED, REJECTED
  approvedBy String?                            // ID de l'Owner/Manager qui a approuvé
  notes      String?
  createdAt  DateTime      @default(now())
  updatedAt  DateTime      @updatedAt
  staff      Staff         @relation(fields: [staffId], references: [id], onDelete: Cascade)
  salon      Salon         @relation(fields: [salonId], references: [id], onDelete: Cascade)

  @@index([staffId])
  @@index([salonId])
  @@index([startDate])
  @@index([endDate])
  @@index([status])
}
```

#### Modification du modèle Staff
```prisma
model Staff {
  // ... champs existants
  absences    Absence[]     // Nouvelle relation
}
```

### 2. Services Backend

#### `staffAuth.service.ts`
```typescript
// Fonctions principales :
staffLogin(email, password)          → Connexion employé
firstLoginSetPassword(email, password) → Première connexion (création mot de passe)
getStaffProfile(staffId)             → Profil employé
updateStaffPassword(...)             → Changement de mot de passe
initializeStaffPassword(...)         → Owner initialise mot de passe (optionnel)
```

**Particularité Première Connexion :**
- Vérifie que l'email existe dans la table Staff
- Vérifie que le champ `password` est NULL (= première connexion)
- Crée le mot de passe hashé
- Retourne automatiquement un token JWT (connexion automatique)

#### `absence.service.ts`
```typescript
// Fonctions principales :
createAbsence(data)                  → Créer demande d'absence
getAbsences(filters)                 → Lister absences (avec filtres)
getAbsence(id)                       → Détail d'une absence
updateAbsence(id, data)              → Modifier absence (seulement si PENDING)
approveOrRejectAbsence(id, status)   → Approuver/Rejeter (Owner/Manager)
deleteAbsence(id)                    → Supprimer absence
getStaffAbsenceStats(staffId, year)  → Statistiques par employé
```

**Validations automatiques :**
- Vérification des chevauchements de dates
- Vérification du statut (on ne peut modifier qu'une absence PENDING)
- Calcul automatique du nombre de jours

#### `staffBooking.service.ts`
```typescript
// Fonctions principales :
getMyBookings(filters)               → Rendez-vous de l'employé connecté
getSalonBookings(filters)            → Tous les rendez-vous du salon
updateBookingStatus(id, status)      → Changer statut rendez-vous
addInternalNotes(id, notes)          → Ajouter notes internes
getMyBookingStats(startDate, endDate) → Statistiques employé
```

### 3. Routes API

#### Authentification Employé `/api/staff-auth`
| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | `/login` | ❌ | Connexion employé |
| POST | `/first-login` | ❌ | Première connexion (création mot de passe) |
| GET | `/me` | ✅ | Profil employé connecté |
| PUT | `/password` | ✅ | Changer mot de passe |
| POST | `/:staffId/initialize-password` | ✅ Owner | Owner initialise mot de passe |

#### Rendez-vous Employé `/api/staff-bookings`
| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/my-bookings` | ✅ Staff | Mes rendez-vous |
| GET | `/salon-bookings` | ✅ Staff | Tous les rendez-vous du salon |
| GET | `/my-stats` | ✅ Staff | Mes statistiques |
| PATCH | `/:id/status` | ✅ Staff | Changer statut rendez-vous |
| PATCH | `/:id/notes` | ✅ Staff | Ajouter notes internes |

#### Absences `/api/absences`
| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | `/` | ✅ | Créer demande absence |
| GET | `/` | ✅ | Lister absences (avec filtres) |
| GET | `/:id` | ✅ | Détail absence |
| PUT | `/:id` | ✅ | Modifier absence |
| DELETE | `/:id` | ✅ | Supprimer absence |
| PATCH | `/:id/approve` | ✅ Owner | Approuver/Rejeter absence |
| GET | `/staff/:staffId/stats` | ✅ | Statistiques absences employé |

**Filtres disponibles pour GET `/absences` :**
- `salonId` : Filtrer par salon
- `staffId` : Filtrer par employé
- `status` : Filtrer par statut (PENDING, APPROVED, REJECTED)
- `startDate` : Absences qui se terminent après cette date
- `endDate` : Absences qui commencent avant cette date

---

## Architecture Frontend

### 1. Services API Frontend

#### `staffAuth.service.ts`
```typescript
login(email, password)              → Connexion employé
firstLogin(email, password)         → Première connexion
getProfile()                        → Profil employé
updatePassword(current, new)        → Changer mot de passe
initializePassword(staffId, pwd)    → Owner initialise mot de passe
```

#### `absence.service.ts`
```typescript
createAbsence(data)                 → Créer demande
getAbsences(filters?)               → Lister absences
getAbsence(id)                      → Détail absence
updateAbsence(id, data)             → Modifier absence
approveAbsence(id, notes?)          → Approuver
rejectAbsence(id, notes?)           → Rejeter
deleteAbsence(id)                   → Supprimer
getStaffAbsenceStats(staffId, year?) → Stats
```

#### `staffBooking.service.ts`
```typescript
getMyBookings(filters?)             → Mes rendez-vous
getSalonBookings(filters?)          → Rdv du salon
getMyBookingStats(start, end)       → Mes stats
updateBookingStatus(id, status)     → Changer statut
addInternalNotes(id, notes)         → Ajouter notes
```

### 2. AuthContext Adapté

#### Nouvelles Propriétés
```typescript
interface AuthContextType {
  // ... propriétés existantes
  userType: 'owner' | 'staff' | null    // Type d'utilisateur
  isOwner: boolean                       // Est propriétaire ?
  isStaff: boolean                       // Est employé ?
  isManager: boolean                     // Est manager ?
  staffLogin: (data) => Promise<void>    // Connexion employé
}
```

#### Utilisation dans les composants
```typescript
const { user, userType, isOwner, isStaff, isManager } = useAuth()

// Affichage conditionnel
{isOwner && <OwnerOnlyFeature />}
{isStaff && <StaffOnlyFeature />}
{(isOwner || isManager) && <ManagerFeature />}
```

### 3. Page de Connexion Adaptative

#### SignInForm.tsx
- **Toggle Propriétaire/Employé** : L'utilisateur choisit son type
- **Mode Première Connexion** : Pour les employés qui n'ont pas encore de mot de passe
  - Affiché si l'utilisateur clique sur "Première connexion ?"
  - Affiche un champ "Confirmer mot de passe"
  - Valide que les deux mots de passe correspondent
  - Appelle `/api/staff-auth/first-login`
  - Connexion automatique après création du mot de passe

---

## Flux d'Authentification Employé

### Scénario 1 : Ajout d'un Nouvel Employé

1. **Owner ajoute un employé** via la page `/equipe` :
   ```json
   {
     "salonId": "xxx",
     "email": "employe@example.com",
     "firstName": "Jean",
     "lastName": "Dupont",
     "role": "EMPLOYEE",
     "specialties": ["coiffure"]
     // PAS de mot de passe !
   }
   ```

2. **Owner informe l'employé** :
   - "Vous avez un compte sur notre plateforme"
   - "Votre email de connexion est : employe@example.com"
   - "Rendez-vous sur [URL] et cliquez sur 'Première connexion ?'"

### Scénario 2 : Première Connexion de l'Employé

1. **Employé arrive sur la page de connexion**
2. **Clique sur l'onglet "Employé"**
3. **Clique sur "Première connexion ?"**
4. **Formulaire s'adapte** :
   - Champ Email
   - Champ "Choisir un mot de passe"
   - Champ "Confirmer le mot de passe"
   - Bouton "Créer mon mot de passe"

5. **Soumet le formulaire** :
   ```http
   POST /api/staff-auth/first-login
   {
     "email": "employe@example.com",
     "password": "monmotdepasse123"
   }
   ```

6. **Backend vérifie** :
   - ✅ Email existe dans la table Staff
   - ✅ Champ `password` est NULL
   - ✅ Compte est actif (`isActive = true`)
   - ❌ Si déjà un mot de passe → Erreur "Ce compte a déjà un mot de passe"

7. **Mot de passe créé** :
   - Hash du mot de passe avec bcrypt
   - Enregistrement dans la BDD
   - Génération du token JWT
   - **Connexion automatique**

8. **Redirection vers le dashboard** `/`

### Scénario 3 : Connexions Suivantes

1. **Employé arrive sur la page de connexion**
2. **Sélectionne "Employé"**
3. **Entre email + mot de passe**
4. **Soumet** → Appel `/api/staff-auth/login`
5. **Connexion réussie** → Redirection `/`

---

## Gestion des Absences

### Workflow Complet

#### 1. Employé Crée une Demande

**Frontend** :
```typescript
await absenceService.createAbsence({
  staffId: currentUser.id,
  salonId: currentUser.salonId,
  type: 'VACATION',  // ou SICK_LEAVE, PERSONAL, OTHER
  startDate: '2025-02-15',
  endDate: '2025-02-20',
  reason: 'Vacances familiales',
  notes: 'Merci de valider rapidement'
})
```

**Backend** :
- Vérifie que les dates sont valides (fin > début)
- Vérifie qu'il n'y a pas de chevauchement avec d'autres absences APPROVED ou PENDING
- Crée l'absence avec `status: PENDING`

#### 2. Owner Consulte les Demandes

**Frontend** :
```typescript
// Toutes les absences en attente du salon
const absences = await absenceService.getAbsences({
  salonId: selectedSalon.id,
  status: 'PENDING'
})
```

#### 3. Owner Approuve/Rejette

**Frontend** :
```typescript
// Approuver
await absenceService.approveAbsence(absenceId, 'Congés approuvés')

// Rejeter
await absenceService.rejectAbsence(absenceId, 'Période de haute activité')
```

**Backend** :
- Vérifie que l'absence est en `PENDING`
- Change le statut vers `APPROVED` ou `REJECTED`
- Enregistre l'ID de l'approbateur et les notes

#### 4. Statistiques

**Frontend** :
```typescript
const stats = await absenceService.getStaffAbsenceStats(staffId, 2025)

// Retour :
{
  year: 2025,
  totalDays: 25,
  totalAbsences: 5,
  byType: {
    VACATION: 20,
    SICK_LEAVE: 3,
    PERSONAL: 2,
    OTHER: 0
  },
  absences: [...]  // Liste complète
}
```

---

## API Endpoints

### Exemples d'Utilisation

#### 1. Première Connexion Employé

```bash
POST http://localhost:5000/api/staff-auth/first-login
Content-Type: application/json

{
  "email": "employe@example.com",
  "password": "password123"
}

# Réponse :
{
  "success": true,
  "message": "Mot de passe créé avec succès. Vous êtes maintenant connecté.",
  "data": {
    "user": {
      "id": "...",
      "email": "employe@example.com",
      "firstName": "Jean",
      "lastName": "Dupont",
      "role": "EMPLOYEE",
      "salon": { ... }
    },
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "userType": "staff"
  }
}
```

#### 2. Connexion Employé Classique

```bash
POST http://localhost:5000/api/staff-auth/login
Content-Type: application/json

{
  "email": "employe@example.com",
  "password": "password123"
}

# Réponse :
{
  "success": true,
  "message": "Connexion réussie",
  "data": {
    "user": { ... },
    "token": "...",
    "userType": "staff"
  }
}
```

#### 3. Créer Demande d'Absence

```bash
POST http://localhost:5000/api/absences
Authorization: Bearer <token>
Content-Type: application/json

{
  "staffId": "staff-id-here",
  "salonId": "salon-id-here",
  "type": "VACATION",
  "startDate": "2025-02-15",
  "endDate": "2025-02-20",
  "reason": "Vacances familiales"
}

# Réponse :
{
  "success": true,
  "message": "Demande d'absence créée avec succès",
  "data": {
    "id": "...",
    "type": "VACATION",
    "status": "PENDING",
    "startDate": "2025-02-15T00:00:00.000Z",
    "endDate": "2025-02-20T00:00:00.000Z",
    "staff": { ... }
  }
}
```

#### 4. Lister Absences du Salon

```bash
GET http://localhost:5000/api/absences?salonId=xxx&status=PENDING
Authorization: Bearer <token>

# Réponse :
{
  "success": true,
  "count": 3,
  "data": [
    {
      "id": "...",
      "type": "VACATION",
      "status": "PENDING",
      "startDate": "2025-02-15",
      "endDate": "2025-02-20",
      "staff": {
        "firstName": "Jean",
        "lastName": "Dupont",
        "avatar": "..."
      }
    },
    ...
  ]
}
```

#### 5. Approuver Absence

```bash
PATCH http://localhost:5000/api/absences/absence-id-here/approve
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "APPROVED",
  "notes": "Congés approuvés"
}

# Réponse :
{
  "success": true,
  "message": "Absence approuvée avec succès",
  "data": {
    "id": "...",
    "status": "APPROVED",
    "approvedBy": "owner-id",
    "notes": "Congés approuvés"
  }
}
```

#### 6. Mes Rendez-vous (Employé)

```bash
GET http://localhost:5000/api/staff-bookings/my-bookings?startDate=2025-02-01&endDate=2025-02-28
Authorization: Bearer <token>

# Réponse :
{
  "success": true,
  "count": 15,
  "total": 15,
  "data": [
    {
      "id": "...",
      "startTime": "2025-02-15T10:00:00.000Z",
      "endTime": "2025-02-15T11:00:00.000Z",
      "status": "CONFIRMED",
      "client": {
        "firstName": "Marie",
        "lastName": "Martin",
        "email": "marie@example.com"
      },
      "service": {
        "name": "Coupe Femme",
        "duration": 60,
        "price": "35.00"
      }
    },
    ...
  ]
}
```

#### 7. Statistiques Rendez-vous Employé

```bash
GET http://localhost:5000/api/staff-bookings/my-stats?startDate=2025-02-01&endDate=2025-02-28
Authorization: Bearer <token>

# Réponse :
{
  "success": true,
  "data": {
    "total": 45,
    "byStatus": {
      "completed": 30,
      "pending": 5,
      "canceled": 3,
      "inProgress": 2,
      "confirmed": 5
    },
    "totalRevenue": 1250.50
  }
}
```

---

## Guide de Test

### Prérequis

1. **Base de données synchronisée** :
   ```bash
   cd backend_fresha
   npx prisma db push
   ```

2. **Backend démarré** :
   ```bash
   npm run dev
   # Doit tourner sur http://localhost:5000
   ```

3. **Frontend démarré** :
   ```bash
   cd fresha_clone_sb
   npm run dev
   # Doit tourner sur http://localhost:5173
   ```

### Tests Pas à Pas

#### Test 1 : Création d'un Employé (Owner)

1. Connexion en tant qu'Owner sur http://localhost:5173/signin
2. Aller sur `/equipe`
3. Cliquer "Ajouter un employé"
4. Remplir :
   - Email : `jean.dupont@example.com`
   - Prénom : `Jean`
   - Nom : `Dupont`
   - Rôle : `EMPLOYEE`
   - Spécialités : `coiffure`
   - **NE PAS remplir le mot de passe**
5. Valider
6. ✅ L'employé apparaît dans la liste

#### Test 2 : Première Connexion Employé

1. **Se déconnecter**
2. Sur la page de connexion :
   - Cliquer sur l'onglet **"Employé"**
   - Cliquer sur **"Première connexion ?"**
3. Remplir :
   - Email : `jean.dupont@example.com`
   - Mot de passe : `password123`
   - Confirmer : `password123`
4. Cliquer **"Créer mon mot de passe"**
5. ✅ Redirection automatique vers le dashboard
6. ✅ L'utilisateur est connecté en tant qu'employé

#### Test 3 : Connexion Normale Employé

1. **Se déconnecter**
2. Sur la page de connexion :
   - Sélectionner **"Employé"**
3. Remplir :
   - Email : `jean.dupont@example.com`
   - Mot de passe : `password123`
4. Cliquer **"Se connecter"**
5. ✅ Connexion réussie

#### Test 4 : Vérification Erreur Première Connexion

1. **Se déconnecter**
2. Essayer de refaire une "Première connexion" avec le même email
3. ❌ Erreur : "Ce compte a déjà un mot de passe. Utilisez la connexion normale."
4. ✅ Comportement attendu

#### Test 5 : Demande d'Absence (Employé)

**NOTE : La page des absences n'est pas encore créée dans le frontend. Utilisez Postman ou curl**

```bash
# Se connecter en tant qu'employé pour obtenir le token
POST http://localhost:5000/api/staff-auth/login
{
  "email": "jean.dupont@example.com",
  "password": "password123"
}

# Copier le token retourné

# Créer une absence
POST http://localhost:5000/api/absences
Authorization: Bearer <token>
{
  "staffId": "<staff-id>",
  "salonId": "<salon-id>",
  "type": "VACATION",
  "startDate": "2025-03-01",
  "endDate": "2025-03-05",
  "reason": "Congés annuels"
}

# Lister mes absences
GET http://localhost:5000/api/absences?staffId=<staff-id>
Authorization: Bearer <token>
```

#### Test 6 : Approbation d'Absence (Owner)

```bash
# Se connecter en tant qu'Owner
POST http://localhost:5000/api/auth/login
{
  "email": "owner@example.com",
  "password": "password123"
}

# Lister les absences en attente
GET http://localhost:5000/api/absences?salonId=<salon-id>&status=PENDING
Authorization: Bearer <owner-token>

# Approuver une absence
PATCH http://localhost:5000/api/absences/<absence-id>/approve
Authorization: Bearer <owner-token>
{
  "status": "APPROVED",
  "notes": "Congés approuvés"
}
```

#### Test 7 : Rendez-vous Employé

```bash
# Se connecter en tant qu'employé
# ...

# Mes rendez-vous
GET http://localhost:5000/api/staff-bookings/my-bookings
Authorization: Bearer <staff-token>

# Tous les rendez-vous du salon
GET http://localhost:5000/api/staff-bookings/salon-bookings
Authorization: Bearer <staff-token>

# Mes statistiques
GET http://localhost:5000/api/staff-bookings/my-stats
Authorization: Bearer <staff-token>

# Changer le statut d'un rendez-vous
PATCH http://localhost:5000/api/staff-bookings/<booking-id>/status
Authorization: Bearer <staff-token>
{
  "status": "IN_PROGRESS"
}
```

---

## Prochaines Étapes

### Frontend à Compléter

#### 1. Page de Gestion des Absences
**Localisation** : `fresha_clone_sb/src/pages/absences/AbsencesPage.tsx`

**Fonctionnalités** :
- **Pour Employé** :
  - Bouton "Nouvelle demande"
  - Modal de création (dates, type, raison)
  - Liste de ses absences avec statuts (badges colorés)
  - Actions : Modifier (si PENDING), Supprimer (si PENDING/REJECTED)
  - Calendrier visuel des absences

- **Pour Owner** :
  - Liste de toutes les absences du salon
  - Filtres : Par employé, par statut, par période
  - Actions : Approuver, Rejeter (avec notes)
  - Statistiques : Nombre de jours d'absence par employé

**Exemple de structure** :
```typescript
// Si employé
<StaffAbsenceView />
  - <AbsenceCalendar />
  - <CreateAbsenceButton />
  - <MyAbsencesList />

// Si owner
<OwnerAbsenceView />
  - <AbsenceFilters />
  - <PendingAbsencesList />
  - <AllAbsencesList />
  - <AbsenceStats />
```

#### 2. Adaptation du Calendrier Existant

**Fichier** : `fresha_clone_sb/src/pages/calendrier/calendrier.tsx`

**Modifications** :
```typescript
const { user, userType, isOwner, isStaff } = useAuth()

// Si employé, charger uniquement ses rendez-vous OU tous les rdv du salon
useEffect(() => {
  if (isStaff) {
    // Option 1 : Seulement mes rdv
    const bookings = await staffBookingService.getMyBookings()

    // Option 2 : Tous les rdv du salon (pour voir les collègues)
    const allBookings = await staffBookingService.getSalonBookings()
  }

  if (isOwner) {
    // Comportement actuel : tous les rdv du salon sélectionné
    const bookings = await bookingService.getBySalon(selectedSalonId)
  }
}, [userType])
```

**Ajout des absences sur le calendrier** :
- Afficher les absences approuvées comme des événements spéciaux
- Couleur différente (ex: gris pour indisponible)
- Empêcher la prise de rdv sur les périodes d'absence

#### 3. Adaptation du Dashboard

**Fichier** : `fresha_clone_sb/src/pages/Dashboard/home.tsx`

**Pour Employé** :
```typescript
{isStaff && (
  <>
    <StaffDashboard>
      - Mes rendez-vous du jour
      - Mes rendez-vous à venir
      - Mes statistiques (nb rdv complétés, chiffre d'affaires)
      - Mes absences à venir
      - Bouton rapide "Demander une absence"
    </StaffDashboard>
  </>
)}

{isOwner && (
  <>
    {/* Dashboard actuel */}
  </>
)}
```

#### 4. Adaptation de la Sidebar

**Fichier** : `fresha_clone_sb/src/layout/AppSidebar.tsx`

**Menus selon le type d'utilisateur** :
```typescript
{isOwner && (
  <>
    <MenuItem to="/">Dashboard</MenuItem>
    <MenuItem to="/calendar">Calendrier</MenuItem>
    <MenuItem to="/equipe">Équipe</MenuItem>
    <MenuItem to="/services">Services</MenuItem>
    <MenuItem to="/salons">Salons</MenuItem>
    <MenuItem to="/clients">Clients</MenuItem>
    <MenuItem to="/absences">Absences</MenuItem>  {/* Toutes les absences */}
  </>
)}

{isStaff && (
  <>
    <MenuItem to="/">Mon Dashboard</MenuItem>
    <MenuItem to="/calendar">Mon Calendrier</MenuItem>
    <MenuItem to="/salon-calendar">Calendrier du Salon</MenuItem>  {/* Nouveau */}
    <MenuItem to="/my-absences">Mes Absences</MenuItem>  {/* Nouveau */}
  </>
)}
```

### Backend à Améliorer

#### 1. Middlewares de Permissions
Créer des middlewares pour vérifier les rôles :
```typescript
// backend_fresha/src/middlewares/role.middleware.ts
export function requireOwner(req, res, next) {
  if (req.user.userType !== 'owner') {
    return res.status(403).json({ error: 'Accès réservé aux propriétaires' })
  }
  next()
}

export function requireStaff(req, res, next) {
  if (req.user.userType !== 'staff') {
    return res.status(403).json({ error: 'Accès réservé aux employés' })
  }
  next()
}

export function requireManager(req, res, next) {
  if (req.user.userType !== 'staff' || req.user.role !== 'MANAGER') {
    return res.status(403).json({ error: 'Accès réservé aux managers' })
  }
  next()
}
```

**Usage** :
```typescript
// Routes absences
router.patch('/:id/approve', authenticate, requireOwner, absenceController.approveOrRejectAbsence)
```

#### 2. Notifications (Optionnel)
- Email quand une absence est approuvée/rejetée
- Email de rappel de rendez-vous
- Notifications in-app

#### 3. Validation des Conflits
- Empêcher la prise de rdv si l'employé a une absence approuvée
- Avertissement si demande d'absence pendant une période avec beaucoup de rdv

---

## Résumé des Fichiers Créés/Modifiés

### Backend

**Nouveaux fichiers** :
- `backend_fresha/src/services/staffAuth.service.ts`
- `backend_fresha/src/services/absence.service.ts`
- `backend_fresha/src/controllers/staffAuth.controller.ts`
- `backend_fresha/src/controllers/absence.controller.ts`
- `backend_fresha/src/controllers/staffBooking.controller.ts`
- `backend_fresha/src/routes/staffAuth.routes.ts`
- `backend_fresha/src/routes/absence.routes.ts`
- `backend_fresha/src/routes/staffBooking.routes.ts`

**Fichiers modifiés** :
- `backend_fresha/prisma/schema.prisma` : Ajout modèle Absence + relations
- `backend_fresha/src/app.ts` : Ajout des nouvelles routes

### Frontend

**Nouveaux fichiers** :
- `fresha_clone_sb/src/services/staffAuth.service.ts`
- `fresha_clone_sb/src/services/absence.service.ts`
- `fresha_clone_sb/src/services/staffBooking.service.ts`

**Fichiers modifiés** :
- `fresha_clone_sb/src/context/AuthContext.tsx` : Support multi-types d'utilisateurs
- `fresha_clone_sb/src/components/auth/SignInForm.tsx` : Toggle Owner/Staff + Première connexion

---

## FAQ

### Q1 : Comment un employé obtient-il son email de connexion ?
**R :** Le propriétaire lui communique l'email utilisé lors de la création de son compte. Il est recommandé d'utiliser l'email professionnel de l'employé.

### Q2 : Que se passe-t-il si un employé oublie son mot de passe ?
**R :** Pour l'instant, l'Owner peut réinitialiser le mot de passe via la route `/api/staff-auth/:staffId/initialize-password`. Une fonctionnalité "Mot de passe oublié" peut être ajoutée plus tard.

### Q3 : Un Manager peut-il approuver des absences ?
**R :** La logique backend est prête, mais il faut ajouter le middleware `requireOwnerOrManager` sur les routes d'approbation.

### Q4 : Les employés peuvent-ils voir les absences de leurs collègues ?
**R :** Actuellement, un employé peut lister toutes les absences du salon via l'API. Pour restreindre, ajoutez un filtre dans le backend.

### Q5 : Comment empêcher les rdv pendant les absences ?
**R :** Modifier le service `booking.service.ts` pour vérifier les absences approuvées avant de créer un rendez-vous.

### Q6 : Peut-on envoyer des emails automatiques ?
**R :** Oui, intégrer un service comme Nodemailer ou SendGrid. Ajouter des fonctions d'envoi d'email dans les services d'absence et de rendez-vous.

---

## Support et Contribution

Pour toute question ou amélioration :
1. Vérifier cette documentation
2. Consulter le code source (bien commenté)
3. Tester les endpoints avec Postman
4. Contacter l'équipe de développement

**Bon développement ! 🚀**
