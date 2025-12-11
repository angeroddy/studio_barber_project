# 📅 Implémentation de la Grille de Planification des Horaires du Staff

## ✅ Ce qui a été créé

### 1. **Composant Principal : StaffScheduleGrid**
**Fichier :** `fresha_clone_sb/src/pages/staff/StaffScheduleGrid.tsx`

**Fonctionnalités implémentées :**
- ✅ Navigation par semaine (flèches précédent/suivant)
- ✅ Affichage de la semaine courante avec dates ("19 - 25 janv., 2026")
- ✅ Indicateur de période ("Cette semaine", "Semaine suivante", etc.)
- ✅ Grille des 7 jours de la semaine (Lun-Dim)
- ✅ Liste de tous les membres du staff avec avatars
- ✅ Affichage des plages horaires pour chaque jour
- ✅ Calcul automatique du total d'heures par semaine pour chaque staff
- ✅ Calcul automatique du total d'heures par jour (tous les staff)
- ✅ Gestion des jours travaillés vs jours de repos
- ✅ Cellules cliquables (prêtes pour ouvrir le modal d'édition)
- ✅ Design responsive avec animations

**Structure de la grille :**
```
┌────────────────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐
│ Membre équipe  │ Lun │ Mar │ Mer │ Jeu │ Ven │ Sam │ Dim │
├────────────────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│ [Avatar] Jean  │10:00│10:00│10:00│10:00│10:00│10:00│ Ne  │
│ 52 h          │19:00│19:00│19:00│19:00│19:00│17:00│work │
└────────────────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘
```

---

### 2. **Styles CSS**
**Fichier :** `fresha_clone_sb/src/pages/staff/StaffScheduleGrid.css`

**Caractéristiques :**
- Design moderne inspiré de Fresha
- Grille CSS responsive (grid-template-columns)
- Animations douces (fadeIn, hover effects)
- États visuels distincts :
  - Cellules actives : fond violet clair (#ede9fe)
  - Cellules inactives : fond blanc
  - Hover effects pour l'interactivité
- Responsive design (breakpoints à 1400px, 1200px, 992px)
- Loading spinner animé

---

### 3. **Page d'Intégration**
**Fichier :** `fresha_clone_sb/src/pages/staff/StaffSchedulePage.tsx`

**Contenu :**
- En-tête avec titre "Planification des horaires"
- Système d'onglets (Horaires hebdomadaires / Paramètres)
- Intégration du composant StaffScheduleGrid
- Layout cohérent avec le reste de l'application

---

### 4. **Routing**
**Fichier modifié :** `fresha_clone_sb/src/App.tsx`

**Route ajoutée :**
```tsx
<Route path="/planification" element={<StaffSchedulePage />} />
```

**Accès :** Naviguer vers `/planification` dans l'application

---

### 5. **Navigation Sidebar**
**Fichier modifié :** `fresha_clone_sb/src/layout/AppSidebar.tsx`

**Ajout dans la section GESTION :**
```tsx
{
  icon: <TimeIcon />,
  name: "Planification",
  path: "/planification",
}
```

**Position :** Après "Équipe" et avant "Mes Salons"

---

### 6. **Types TypeScript**
**Fichier modifié :** `fresha_clone_sb/src/services/staff.service.ts`

**Interfaces ajoutées :**

```typescript
export interface StaffSchedule {
  id: string;
  staffId: string;
  dayOfWeek: number;  // 0 = Dimanche, 1 = Lundi, ..., 6 = Samedi
  startTime: string;  // Format "HH:mm"
  endTime: string;    // Format "HH:mm"
  isAvailable: boolean;
}

export interface Staff {
  // ... champs existants
  schedules?: StaffSchedule[];  // ✅ NOUVEAU
}
```

---

### 7. **Backend API**
**Fichier modifié :** `backend_fresha/src/services/staff.service.ts`

**Modification de `getStaffBySalon()` :**

```typescript
schedules: {
  select: {
    id: true,
    staffId: true,
    dayOfWeek: true,
    startTime: true,
    endTime: true,
    isAvailable: true
  },
  orderBy: {
    dayOfWeek: 'asc'
  }
}
```

**Impact :** L'API retourne maintenant les horaires de travail avec les données du staff.

---

## 🎨 Design & UX

### Couleurs
- **Cellules actives :** `#ede9fe` (violet clair)
- **Texte principal :** `#111827` (noir)
- **Texte secondaire :** `#6b7280` (gris)
- **Bordures :** `#e5e7eb` (gris clair)
- **Hover :** `#f3f4f6` (gris très clair)

### Interactions
- ✅ Clic sur une cellule : Console log (prêt pour modal)
- ✅ Hover sur cellule : Changement de couleur + icône crayon
- ✅ Hover sur ligne : Fond gris clair
- ✅ Boutons navigation : Effet scale au clic

### Responsive
- **Desktop (>1400px) :** Grille complète avec toutes les colonnes
- **Tablette (1200px-1400px) :** Colonnes plus étroites
- **Mobile (<992px) :** Scroll horizontal avec largeur minimale

---

## 📊 Calculs Automatiques

### Total heures par semaine (par staff)
```typescript
getTotalWeekHours(staff) {
  return staff.schedules.reduce((total, schedule) => {
    if (schedule.isAvailable) {
      return total + calculateDuration(schedule.startTime, schedule.endTime);
    }
    return total;
  }, 0);
}
```

**Exemple :** Jean travaille 6 jours x 9h = 54h + 1 jour x 8h = 62h

### Total heures par jour (tous les staff)
```typescript
getTotalDayHours(dayOfWeek) {
  return staffMembers.reduce((total, staff) => {
    const schedule = getScheduleForDay(staff, dayOfWeek);
    if (schedule && schedule.isAvailable) {
      return total + calculateDuration(schedule.startTime, schedule.endTime);
    }
    return total;
  }, 0);
}
```

**Exemple :** Lundi : 3 staff x 9h = 27h total

---

## 🔄 Navigation Temporelle

### Fonctions clés
```typescript
getStartOfWeek(date)     // Calcule le lundi de la semaine
navigateToPreviousWeek() // -7 jours
navigateToNextWeek()     // +7 jours
getWeekRange()           // "19 - 25 janv., 2026"
getWeekLabel()           // "Cette semaine", "Semaine suivante", etc.
```

### Logique de la semaine
- **Début de semaine :** Lundi (pas dimanche)
- **Format dates :** "lun. 19 janv."
- **Calcul différence :** Nombre de semaines depuis aujourd'hui

---

## 🗄️ Structure des Données

### Dans la BDD (table StaffSchedule)
```prisma
model StaffSchedule {
  id          String  @id @default(uuid())
  staffId     String
  dayOfWeek   Int     // 0-6
  startTime   String  // "10:00"
  endTime     String  // "19:00"
  isAvailable Boolean @default(true)

  staff       Staff   @relation(...)
}
```

### Exemple de données
```json
{
  "id": "staff-123",
  "firstName": "Jean",
  "lastName": "Dupont",
  "schedules": [
    {
      "id": "schedule-1",
      "dayOfWeek": 1,
      "startTime": "10:00",
      "endTime": "19:00",
      "isAvailable": true
    },
    {
      "id": "schedule-2",
      "dayOfWeek": 2,
      "startTime": "10:00",
      "endTime": "19:00",
      "isAvailable": true
    }
    // ... pour les autres jours
  ]
}
```

---

## 🚀 Comment Utiliser

### 1. Démarrer l'application
```bash
# Frontend
cd fresha_clone_sb
npm run dev

# Backend
cd backend_fresha
npm run dev
```

### 2. Accéder à la page
- Connectez-vous à l'application
- Dans la sidebar, section **GESTION**
- Cliquez sur **Planification** (icône horloge)
- Ou allez directement sur `/planification`

### 3. Navigation
- **Flèche gauche :** Semaine précédente
- **Flèche droite :** Semaine suivante
- **Cellule horaire :** Clic pour éditer (pas encore implémenté)

---

## ❌ Ce qui RESTE À FAIRE

### 1. Modal d'Édition des Horaires (Priorité 1)
**Fichier à créer :** `StaffScheduleModal.tsx`

**Fonctionnalités :**
- Formulaire avec plusieurs plages horaires
- Sélection heure début / heure fin
- Bouton "Ajouter une plage horaire"
- Calcul durée totale du quart de travail
- Boutons : Supprimer / Annuler / Enregistrer

**Référence :** Image du modal Fresha fournie

---

### 2. API Backend pour les Horaires

**Routes à créer :**

```typescript
// Horaires récurrents (hebdomadaires)
POST   /api/staff/:id/schedules          // Créer/mettre à jour horaires
GET    /api/staff/:id/schedules          // Récupérer horaires
DELETE /api/staff/:id/schedules/:scheduleId

// Shifts ponctuels (exceptions)
POST   /api/staff/:id/shifts             // Créer shift pour une date
GET    /api/staff/:id/shifts/:date       // Récupérer shifts d'une date
PUT    /api/staff/:id/shifts/:shiftId    // Modifier un shift
DELETE /api/staff/:id/shifts/:shiftId    // Supprimer un shift
```

---

### 3. Système d'Exceptions (StaffShift)

**Nouvelle table à créer :**

```prisma
model StaffShift {
  id          String   @id @default(uuid())
  staffId     String
  date        DateTime // Date spécifique (2025-12-08)
  startTime   String   // "10:00"
  endTime     String   // "19:00"
  isWorking   Boolean  @default(true)

  staff       Staff    @relation(...)

  @@unique([staffId, date, startTime])
}
```

**Logique :**
- Si un `StaffShift` existe pour une date : utiliser ce shift
- Sinon : utiliser l'horaire récurrent (`StaffSchedule`)

---

### 4. Données de Test

**Créer des schedules de test :**

```sql
-- Exemple pour un staff
INSERT INTO "StaffSchedule" (id, staffId, dayOfWeek, startTime, endTime, isAvailable)
VALUES
  (uuid(), 'staff-id-here', 1, '10:00', '19:00', true),  -- Lundi
  (uuid(), 'staff-id-here', 2, '10:00', '19:00', true),  -- Mardi
  (uuid(), 'staff-id-here', 3, '10:00', '19:00', true),  -- Mercredi
  (uuid(), 'staff-id-here', 4, '10:00', '19:00', true),  -- Jeudi
  (uuid(), 'staff-id-here', 5, '10:00', '19:00', true),  -- Vendredi
  (uuid(), 'staff-id-here', 6, '10:00', '17:00', true),  -- Samedi
  (uuid(), 'staff-id-here', 0, '00:00', '00:00', false); -- Dimanche (fermé)
```

---

### 5. Intégration avec CRUD Staff

**Modifier :** `crudStaff.tsx`

**Ajouter :**
- Bouton "Gérer les horaires" dans les actions
- Lien vers la page de planification
- Badge indiquant si les horaires sont configurés

---

### 6. Modal "Périodes de Travail Planifiées"

**Pour éditer les horaires par défaut (récurrents)**

**Fonctionnalités :**
- Table des 7 jours de la semaine
- Champs heure début / heure fin pour chaque jour
- Toggle disponible / non disponible
- Bouton "Appliquer à tous les jours"
- Bouton "Copier les horaires d'un autre membre"

---

## 📁 Structure des Fichiers

```
fresha_clone_sb/
├── src/
│   ├── pages/
│   │   └── staff/
│   │       ├── crudStaff.tsx               (existant)
│   │       ├── StaffScheduleGrid.tsx       ✅ NOUVEAU
│   │       ├── StaffScheduleGrid.css       ✅ NOUVEAU
│   │       └── StaffSchedulePage.tsx       ✅ NOUVEAU
│   ├── layout/
│   │   └── AppSidebar.tsx                  ✅ MODIFIÉ
│   ├── services/
│   │   └── staff.service.ts                ✅ MODIFIÉ
│   └── App.tsx                              ✅ MODIFIÉ

backend_fresha/
└── src/
    └── services/
        └── staff.service.ts                 ✅ MODIFIÉ
```

---

## 🎯 Points Techniques Importants

### 1. Gestion des jours de la semaine
```typescript
// JavaScript : 0 = Dimanche, 1 = Lundi, ..., 6 = Samedi
// BDD Prisma : Même convention (0-6)
```

### 2. Format des heures
```typescript
// Toujours "HH:mm" (24h)
// Exemples valides : "09:00", "13:30", "18:00"
```

### 3. Calcul de durée
```typescript
const calculateDuration = (start: "10:00", end: "19:00") => {
  // Retourne : 9 (heures)
}
```

### 4. Responsive Grid
```css
grid-template-columns: 280px repeat(7, 1fr);
/* Colonne staff fixe + 7 colonnes flexibles pour les jours */
```

---

## 🐛 Troubleshooting

### Les horaires ne s'affichent pas
**Solution :** Vérifiez que :
1. Le backend retourne bien les `schedules` dans la réponse
2. Le salon est sélectionné (`selectedSalon` n'est pas null)
3. Les membres du staff ont des schedules dans la BDD

### La navigation ne fonctionne pas
**Solution :** Vérifiez les imports :
```tsx
import { Link } from "react-router-dom"; // ✅ Correct
import { Link } from "react-router";     // ❌ Mauvais import
```

### Erreurs TypeScript
**Solution :** Assurez-vous que :
```typescript
schedules?: StaffSchedule[];  // Le "?" est important (optionnel)
```

---

## 📝 Notes de Développement

### Pourquoi pas FullCalendar ?
- FullCalendar est adapté pour les événements/rendez-vous
- Notre besoin : grille simple staff x jours
- Une grille CSS personnalisée est plus légère et flexible

### Système Hybride Recommandé
- **StaffSchedule :** Horaires par défaut (se répètent chaque semaine)
- **StaffShift :** Exceptions ponctuelles (remplacent l'horaire par défaut)

**Exemple :**
- Jean travaille normalement 10h-19h tous les lundis (StaffSchedule)
- Mais le lundi 25 déc. il travaille 14h-18h (StaffShift)
- Le système affiche 14h-18h pour le 25 déc. (exception prioritaire)

---

## ✨ Améliorations Futures

1. **Export PDF** : Générer un planning PDF pour impression
2. **Vue Mensuelle** : Calendrier mensuel avec les horaires
3. **Conflits** : Détection automatique des conflits de planning
4. **Templates** : Copier les horaires d'un staff vers un autre
5. **Historique** : Voir les modifications passées des horaires
6. **Notifications** : Alerter le staff des changements d'horaires
7. **Statistiques** : Graphiques d'heures travaillées par période

---

## 👥 Contributeurs

- **Analyse initiale :** Étude de l'interface Fresha
- **Implémentation :** Composant StaffScheduleGrid + intégration
- **Backend :** Modification de l'API pour inclure les schedules

---

## 📚 Références

- **Design Fresha :** Captures d'écran fournies
- **Base de données :** Schéma Prisma existant (StaffSchedule)
- **Framework :** React + TypeScript + TailwindCSS

---

**Date de création :** 9 décembre 2025
**Version :** 1.0.0 - Grille de planification (sans modal d'édition)
