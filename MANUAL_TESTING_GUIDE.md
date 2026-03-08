# Guide de Tests Manuels Complets
## Fresha-Clone-Project - Production Readiness

**Version** : 1.0
**Date** : 11 Janvier 2026
**Durée estimée** : 2 heures

---

## 📋 Objectif

Ce guide vous permet de tester manuellement toutes les fonctionnalités critiques du système avant le déploiement en production.

---

## 🔧 Prérequis

### Environnements à Tester

- [ ] **Local** : http://localhost:5000 (Backend) + http://localhost:5173 (Employés) + http://localhost:3000 (Clients)
- [ ] **Staging** : URLs de staging si disponibles
- [ ] **Production** : URLs de production

### Comptes de Test

Créer des comptes de test avec ces rôles :

1. **Owner** : `owner.test@example.com` / `TestPassword123!`
2. **Manager** : `manager.test@example.com` / `TestPassword123!`
3. **Employee** : `employee.test@example.com` / `TestPassword123!`
4. **Client** : `client.test@example.com` / `TestPassword123!`

### Outils Nécessaires

- [ ] Navigateur Chrome/Firefox (dernière version)
- [ ] Outil REST API (Postman, Insomnia, ou curl)
- [ ] Console développeur ouverte (F12)
- [ ] Notepad pour noter les bugs trouvés

---

## ✅ SECTION 1 : Tests Backend API

### 1.1 Health Check & Sécurité

#### Test 1.1.1 : Health Check Endpoint

```bash
# Test health check
curl http://localhost:5000/health

# Résultat attendu :
{
  "status": "healthy",
  "timestamp": "2026-01-11T...",
  "uptime": 123.456,
  "environment": "development",
  "message": "Backend is running"
}
```

**Critères de succès** :
- [ ] Statut HTTP 200
- [ ] JSON valide retourné
- [ ] Tous les champs présents

#### Test 1.1.2 : Rate Limiting - Routes Auth

```bash
# Envoyer 6 requêtes rapidement (limite = 5)
for i in {1..6}; do
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}' \
    -w "\nStatus: %{http_code}\n"
  sleep 0.5
done

# Résultat attendu :
# Requêtes 1-5 : 400 ou 401 (unauthorized)
# Requête 6 : 429 (Too Many Requests)
```

**Critères de succès** :
- [ ] 6ème requête retourne 429
- [ ] Message d'erreur : "Trop de tentatives de connexion"

#### Test 1.1.3 : Security Headers (Helmet)

```bash
# Vérifier les headers de sécurité
curl -I http://localhost:5000/health

# Headers attendus :
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# X-DNS-Prefetch-Control: off
# Strict-Transport-Security: max-age=...
```

**Critères de succès** :
- [ ] Au moins 4 security headers présents
- [ ] Pas de header `X-Powered-By: Express`

#### Test 1.1.4 : CORS Configuration

```bash
# Test CORS avec origin autorisé
curl -X OPTIONS http://localhost:5000/api/salons \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: GET" \
  -i

# Vérifier header :
# Access-Control-Allow-Origin: http://localhost:5173
```

**Critères de succès** :
- [ ] Header CORS présent pour origins autorisés
- [ ] Pas de CORS pour origins non autorisés

---

### 1.2 Authentification Owner

#### Test 1.2.1 : Inscription Owner

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner.test@example.com",
    "password": "TestPassword123!",
    "firstName": "Test",
    "lastName": "Owner",
    "phone": "0612345678"
  }'

# Résultat attendu :
{
  "success": true,
  "owner": { "id": "...", "email": "owner.test@example.com", ... },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Critères de succès** :
- [ ] Statut 201 Created
- [ ] Token JWT retourné
- [ ] Owner créé dans la DB
- [ ] Password hashé (vérifier dans DB)

#### Test 1.2.2 : Connexion Owner

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner.test@example.com",
    "password": "TestPassword123!"
  }'
```

**Critères de succès** :
- [ ] Statut 200 OK
- [ ] Token JWT valide retourné
- [ ] Informations owner retournées (sans password)

#### Test 1.2.3 : Token JWT Validation

```bash
# Récupérer le token de la réponse précédente
TOKEN="eyJhbGciOiJIUzI1NiIs..."

curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"

# Résultat attendu :
{
  "success": true,
  "owner": { "id": "...", "email": "...", ... }
}
```

**Critères de succès** :
- [ ] Statut 200 avec token valide
- [ ] Statut 401 sans token
- [ ] Statut 401 avec token invalide

---

### 1.3 Gestion des Salons

#### Test 1.3.1 : Créer un Salon

```bash
curl -X POST http://localhost:5000/api/salons \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Barbershop",
    "slug": "test-barbershop",
    "address": "123 Rue de Test",
    "city": "Paris",
    "zipCode": "75001",
    "phone": "0123456789",
    "email": "contact@testbarber.com"
  }'
```

**Critères de succès** :
- [ ] Statut 201 Created
- [ ] Salon créé avec toutes les données
- [ ] ownerId = ID du owner connecté

#### Test 1.3.2 : Lister les Salons

```bash
curl http://localhost:5000/api/salons

# Résultat attendu :
{
  "success": true,
  "salons": [
    { "id": "...", "name": "Test Barbershop", ... }
  ]
}
```

**Critères de succès** :
- [ ] Statut 200 OK
- [ ] Liste des salons retournée
- [ ] Accessible sans authentification

#### Test 1.3.3 : Modifier un Salon (Ownership Check)

```bash
# Avec le bon owner
curl -X PUT http://localhost:5000/api/salons/{salonId} \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Barbershop"
  }'

# Critères : 200 OK

# Avec un autre owner (créer un 2ème compte)
curl -X PUT http://localhost:5000/api/salons/{salonId} \
  -H "Authorization: Bearer $OTHER_OWNER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "name": "Hack Attempt" }'

# Critères : 403 Forbidden
```

**Critères de succès** :
- [ ] Propriétaire peut modifier : 200 OK
- [ ] Non-propriétaire ne peut pas : 403 Forbidden

---

### 1.4 Gestion des Services

#### Test 1.4.1 : Créer un Service

```bash
curl -X POST http://localhost:5000/api/services \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "salonId": "{salonId}",
    "name": "Coupe Homme",
    "description": "Coupe classique",
    "duration": 30,
    "price": 25.00,
    "category": "Coiffure",
    "isActive": true,
    "color": "#FF5733"
  }'
```

**Critères de succès** :
- [ ] Statut 201 Created
- [ ] Service créé avec price en Decimal
- [ ] Duration et price validés

---

### 1.5 Gestion du Staff

#### Test 1.5.1 : Ajouter un Staff

```bash
curl -X POST http://localhost:5000/api/staff \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "salonId": "{salonId}",
    "firstName": "John",
    "lastName": "Barber",
    "email": "john.barber@test.com",
    "phone": "0612345679",
    "role": "EMPLOYEE",
    "specialties": ["Coupe", "Barbe"],
    "isActive": true
  }'
```

**Critères de succès** :
- [ ] Statut 201 Created
- [ ] Staff créé sans password initialement
- [ ] Email unique vérifié

#### Test 1.5.2 : Staff First Login

```bash
# 1. Owner initialise le password
curl -X POST http://localhost:5000/api/staff-auth/{staffId}/initialize-password \
  -H "Authorization: Bearer $OWNER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "temporaryPassword": "TempPass123!" }'

# 2. Staff se connecte avec password temporaire
curl -X POST http://localhost:5000/api/staff-auth/first-login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.barber@test.com",
    "temporaryPassword": "TempPass123!",
    "newPassword": "MySecurePass456!"
  }'
```

**Critères de succès** :
- [ ] Staff peut changer son password au premier login
- [ ] Token JWT retourné après changement

---

### 1.6 Système de Réservations

#### Test 1.6.1 : Vérifier Disponibilité

```bash
curl -X POST http://localhost:5000/api/bookings/check-availability \
  -H "Content-Type: application/json" \
  -d '{
    "staffId": "{staffId}",
    "startTime": "2026-01-15T10:00:00Z",
    "duration": 30
  }'

# Résultat attendu :
{
  "available": true
}
```

**Critères de succès** :
- [ ] Retourne `available: true` si créneau libre
- [ ] Retourne `available: false` si créneau occupé

#### Test 1.6.2 : Créer une Réservation

```bash
curl -X POST http://localhost:5000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "salonId": "{salonId}",
    "serviceId": "{serviceId}",
    "staffId": "{staffId}",
    "startTime": "2026-01-15T10:00:00Z",
    "duration": 30,
    "clientEmail": "newclient@test.com",
    "clientFirstName": "Test",
    "clientLastName": "Client",
    "clientPhone": "0698765432"
  }'
```

**Critères de succès** :
- [ ] Statut 201 Created
- [ ] Client créé automatiquement si email n'existe pas
- [ ] Réservation créée avec statut PENDING

#### Test 1.6.3 : Conflit de Réservations

```bash
# Créer 2 réservations au même moment pour le même staff
# La 2ème doit échouer

curl -X POST http://localhost:5000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "staffId": "{staffId}",
    "startTime": "2026-01-15T10:00:00Z",
    "duration": 30,
    ...
  }'

# Résultat attendu : 400 Bad Request
# Message : "Créneau non disponible"
```

**Critères de succès** :
- [ ] Système détecte le conflit
- [ ] Erreur 400 retournée
- [ ] 2ème réservation non créée

---

### 1.7 Gestion des Absences

#### Test 1.7.1 : Créer une Absence

```bash
curl -X POST http://localhost:5000/api/absences \
  -H "Authorization: Bearer $STAFF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "staffId": "{staffId}",
    "salonId": "{salonId}",
    "type": "VACATION",
    "startDate": "2026-02-01",
    "endDate": "2026-02-07",
    "reason": "Vacances d'\''hiver"
  }'
```

**Critères de succès** :
- [ ] Absence créée avec statut PENDING
- [ ] Staff peut créer son absence

#### Test 1.7.2 : Approuver/Rejeter Absence (Owner)

```bash
# Approuver
curl -X PATCH http://localhost:5000/api/absences/{absenceId}/approve \
  -H "Authorization: Bearer $OWNER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "status": "APPROVED" }'

# Rejeter
curl -X PATCH http://localhost:5000/api/absences/{absenceId}/approve \
  -H "Authorization: Bearer $OWNER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "status": "REJECTED", "notes": "Période trop chargée" }'
```

**Critères de succès** :
- [ ] Owner peut approuver/rejeter
- [ ] Staff ne peut pas approuver ses propres absences (403)

---

## ✅ SECTION 2 : Tests Frontend Employés

### 2.1 Authentification UI

#### Test 2.1.1 : Page de Connexion

**URL** : http://localhost:5173/signin

1. [ ] Page charge sans erreurs console
2. [ ] Formulaire présent avec email + password
3. [ ] Bouton "Se connecter" visible
4. [ ] Lien vers "S'inscrire" fonctionne

#### Test 2.1.2 : Connexion Owner

1. [ ] Entrer : `owner.test@example.com` / `TestPassword123!`
2. [ ] Cliquer "Se connecter"
3. [ ] **Attendu** : Redirection vers /dashboard
4. [ ] Header affiche le nom de l'utilisateur
5. [ ] Sidebar affiche toutes les sections (Staff, Services, Salons, etc.)

#### Test 2.1.3 : Connexion Staff

1. [ ] Se déconnecter
2. [ ] Se connecter avec : `john.barber@test.com` / `MySecurePass456!`
3. [ ] **Attendu** : Accès limité selon rôle
4. [ ] Manager voit plus de sections qu'Employee

### 2.2 Dashboard

#### Test 2.2.1 : Vue Dashboard Owner

1. [ ] Cartes statistiques affichées (bookings, revenue, etc.)
2. [ ] Graphiques ApexCharts chargent correctement
3. [ ] Liste "Rendez-vous du jour" affichée
4. [ ] Ranking du staff visible

### 2.3 Gestion Salons

#### Test 2.3.1 : Liste des Salons

**URL** : /salons

1. [ ] Table affiche les salons du owner
2. [ ] Bouton "Ajouter salon" visible
3. [ ] Bouton "Modifier" sur chaque ligne
4. [ ] Bouton "Supprimer" avec confirmation

#### Test 2.3.2 : Créer un Salon

1. [ ] Cliquer "Ajouter salon"
2. [ ] Remplir formulaire :
   - Nom : "Test Salon 2"
   - Slug : "test-salon-2"
   - Adresse, ville, code postal, téléphone, email
3. [ ] Cliquer "Enregistrer"
4. [ ] **Attendu** : Message de succès
5. [ ] Salon apparaît dans la liste

#### Test 2.3.3 : Planification Salon

1. [ ] Sélectionner un salon
2. [ ] Aller dans "Planification"
3. [ ] Configurer horaires pour chaque jour :
   - Lundi-Vendredi : 9h-18h
   - Samedi : 10h-17h
   - Dimanche : Fermé
4. [ ] Ajouter TimeSlots (pause déjeuner 12h-14h)
5. [ ] Enregistrer
6. [ ] **Attendu** : Planification sauvegardée

### 2.4 Gestion Services

#### Test 2.4.1 : Créer un Service

**URL** : /services

1. [ ] Cliquer "Ajouter service"
2. [ ] Remplir :
   - Nom : "Coupe + Barbe"
   - Catégorie : "Coiffure"
   - Durée : 45 min
   - Prix : 35 €
   - Couleur : #FF5733
3. [ ] Activer le toggle "Actif"
4. [ ] Enregistrer
5. [ ] **Attendu** : Service visible dans liste

### 2.5 Gestion Staff

#### Test 2.5.1 : Ajouter un Employé

**URL** : /equipe

1. [ ] Cliquer "Ajouter membre"
2. [ ] Remplir :
   - Prénom : "Marie"
   - Nom : "Coiffure"
   - Email : "marie@test.com"
   - Téléphone : "0611223344"
   - Rôle : EMPLOYEE
   - Spécialités : ["Coupe", "Coloration"]
3. [ ] Enregistrer
4. [ ] **Attendu** : Staff créé, password non configuré

#### Test 2.5.2 : Initialiser Password Staff

1. [ ] Cliquer sur "Initialiser mot de passe" pour Marie
2. [ ] Entrer password temporaire : "TempMarie123!"
3. [ ] Confirmer
4. [ ] **Attendu** : Email envoyé (si système email actif)

### 2.6 Calendrier & Réservations

#### Test 2.6.1 : Vue Calendrier

**URL** : /calendrier

1. [ ] FullCalendar charge correctement
2. [ ] Vue "Timeline" par défaut
3. [ ] Staff listés en ressources
4. [ ] Réservations affichées comme events

#### Test 2.6.2 : Créer Réservation depuis Calendrier

1. [ ] Cliquer sur un créneau libre
2. [ ] Formulaire de réservation s'ouvre
3. [ ] Sélectionner :
   - Client : "Test Client" (autocomplete)
   - Service : "Coupe Homme"
   - Staff : "John Barber"
   - Date/Heure : 15/01/2026 10:00
4. [ ] Enregistrer
5. [ ] **Attendu** : Event apparaît dans calendrier

### 2.7 Gestion Absences

#### Test 2.7.1 : Demander une Absence (Staff)

**URL** : /absences

1. [ ] Se connecter en tant que Staff
2. [ ] Cliquer "Nouvelle demande"
3. [ ] Remplir :
   - Type : Congés
   - Du : 01/03/2026
   - Au : 07/03/2026
   - Raison : "Vacances planifiées"
4. [ ] Envoyer
5. [ ] **Attendu** : Statut "En attente"

#### Test 2.7.2 : Approuver Absence (Owner)

1. [ ] Se reconnecter en tant que Owner
2. [ ] Aller dans /absences
3. [ ] Voir la demande de Marie
4. [ ] Cliquer "Approuver"
5. [ ] **Attendu** : Statut passe à "Approuvée"
6. [ ] Absences bloquent les créneaux dans calendrier

---

## ✅ SECTION 3 : Tests Frontend Clients

### 3.1 Page d'Accueil

**URL** : http://localhost:3000

1. [ ] Hero section affiche "STUDIO BARBER"
2. [ ] Images chargent correctement
3. [ ] Bouton "Réserver" visible et cliquable
4. [ ] Animations Framer Motion fonctionnent
5. [ ] Footer présent

### 3.2 Flow de Réservation

#### Test 3.2.1 : Sélection Salon

**URL** : /reserver

1. [ ] Liste des salons affichée avec cartes
2. [ ] Photos des salons visibles
3. [ ] Bouton "Choisir ce salon" sur chaque carte
4. [ ] Cliquer sur un salon
5. [ ] **Attendu** : Redirection vers /reserver/prestations

#### Test 3.2.2 : Sélection Service

**URL** : /reserver/prestations

1. [ ] Services du salon sélectionné affichés
2. [ ] Prix et durées visibles
3. [ ] Catégories filtrées (si plusieurs)
4. [ ] Sélectionner "Coupe Homme"
5. [ ] **Attendu** : Service ajouté au panier
6. [ ] Continuer vers /reserver/professionnel

#### Test 3.2.3 : Sélection Professionnel

**URL** : /reserver/professionnel

1. [ ] Liste des staff disponibles pour le service
2. [ ] Photos et spécialités affichées
3. [ ] Sélectionner "John Barber"
4. [ ] **Attendu** : Redirection vers /reserver/heure

#### Test 3.2.4 : Sélection Créneau Horaire

**URL** : /reserver/heure

1. [ ] Calendrier affiché
2. [ ] Créneaux disponibles en vert
3. [ ] Créneaux occupés/indisponibles en gris
4. [ ] Sélectionner "15/01/2026 à 14:00"
5. [ ] **Attendu** : Créneau sélectionné
6. [ ] Continuer vers /reserver/valider

#### Test 3.2.5 : Validation et Confirmation

**URL** : /reserver/valider

1. [ ] Récapitulatif complet affiché :
   - Salon : Test Barbershop
   - Service : Coupe Homme (25€, 30min)
   - Staff : John Barber
   - Date/Heure : 15/01/2026 14:00
2. [ ] Formulaire client :
   - Email : client2@test.com
   - Prénom : Jean
   - Nom : Dupont
   - Téléphone : 0623456789
3. [ ] Cliquer "Confirmer la réservation"
4. [ ] **Attendu** : Redirection vers page de confirmation
5. [ ] Message "Réservation confirmée !"
6. [ ] Email de confirmation envoyé (si système email actif)

### 3.3 Espace Client

#### Test 3.3.1 : Connexion Client

**URL** : /login

1. [ ] Formulaire de connexion
2. [ ] Se connecter avec : `client2@test.com` / password créé
3. [ ] **Attendu** : Redirection vers /dashboard

#### Test 3.3.2 : Dashboard Client

**URL** : /dashboard

1. [ ] Liste des réservations du client
2. [ ] Réservations à venir affichées en haut
3. [ ] Historique des réservations passées
4. [ ] Bouton "Annuler" sur réservations futures
5. [ ] Bouton "Nouvelle réservation"

#### Test 3.3.3 : Annuler Réservation

1. [ ] Cliquer sur "Annuler" pour une réservation future
2. [ ] Confirmation demandée
3. [ ] Confirmer l'annulation
4. [ ] **Attendu** : Statut passe à "CANCELED"
5. [ ] Créneau redevient disponible dans calendrier

---

## ✅ SECTION 4 : Tests de Performance

### 4.1 Temps de Chargement

#### Test 4.1.1 : Page d'Accueil Client

1. [ ] Ouvrir DevTools > Network
2. [ ] Charger http://localhost:3000
3. [ ] **Attendu** :
   - First Contentful Paint (FCP) < 2s
   - Largest Contentful Paint (LCP) < 3s
   - Time to Interactive (TTI) < 4s

#### Test 4.1.2 : Dashboard Employé

1. [ ] Charger http://localhost:5173/dashboard
2. [ ] **Attendu** :
   - Chargement initial < 2s
   - Graphiques chargent en < 1s après page load

### 4.2 Requêtes API

#### Test 4.2.1 : Liste Salons

```bash
time curl http://localhost:5000/api/salons

# Attendu : < 500ms
```

#### Test 4.2.2 : Liste Bookings (avec filtres)

```bash
time curl "http://localhost:5000/api/bookings?salonId={id}&status=CONFIRMED" \
  -H "Authorization: Bearer $TOKEN"

# Attendu : < 1s
```

---

## ✅ SECTION 5 : Tests de Sécurité

### 5.1 SQL Injection (Prisma Protection)

```bash
# Tenter injection dans email
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com OR 1=1--",
    "password": "anything"
  }'

# Attendu : 400 Bad Request ou 401 Unauthorized
# Pas d'erreur SQL révélée
```

**Critères de succès** :
- [ ] Aucune erreur SQL exposée
- [ ] Requête rejetée proprement

### 5.2 XSS Protection

```bash
# Tenter XSS dans nom de salon
curl -X POST http://localhost:5000/api/salons \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "<script>alert(\"XSS\")</script>",
    "slug": "test",
    ...
  }'

# Vérifier que le script n'est pas exécuté dans le frontend
```

**Critères de succès** :
- [ ] Script stocké comme texte (échappé)
- [ ] Pas d'exécution dans le navigateur

### 5.3 CSRF Protection

```bash
# Tenter requête cross-origin sans CORS
curl -X POST http://localhost:5000/api/salons \
  -H "Origin: http://malicious-site.com" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{...}'

# Attendu : Bloqué par CORS
```

**Critères de succès** :
- [ ] Requête bloquée si Origin non autorisé

---

## ✅ SECTION 6 : Tests d'Erreurs & Edge Cases

### 6.1 Gestion d'Erreurs Backend

#### Test 6.1.1 : Route Inexistante (404)

```bash
curl http://localhost:5000/api/nonexistent

# Attendu :
{
  "success": false,
  "error": "Route non trouvée"
}
# Statut : 404
```

#### Test 6.1.2 : Erreur de Validation

```bash
curl -X POST http://localhost:5000/api/salons \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "",
    "email": "invalid-email"
  }'

# Attendu : 400 Bad Request avec détails de validation
```

### 6.2 Gestion d'Erreurs Frontend

#### Test 6.2.1 : Connexion API Échouée

1. [ ] Arrêter le backend
2. [ ] Tenter de se connecter sur le frontend
3. [ ] **Attendu** : Message d'erreur user-friendly
4. [ ] "Impossible de se connecter au serveur"
5. [ ] Pas de crash de l'application

#### Test 6.2.2 : Session Expirée

1. [ ] Se connecter
2. [ ] Attendre expiration du token (ou modifier manuellement)
3. [ ] Faire une action protégée
4. [ ] **Attendu** : Redirection vers /login
5. [ ] Message "Session expirée"

---

## 📊 RÉCAPITULATIF DES TESTS

### Statistiques

Total de tests : **100+**

#### Par Catégorie :
- [ ] Backend API : 35 tests
- [ ] Frontend Employés : 25 tests
- [ ] Frontend Clients : 15 tests
- [ ] Performance : 5 tests
- [ ] Sécurité : 10 tests
- [ ] Gestion d'erreurs : 10 tests

#### Statut Global :
- ✅ **Passés** : _____ / 100
- ❌ **Échoués** : _____ / 100
- ⚠️ **À revoir** : _____ / 100

---

## 🐛 RAPPORT DE BUGS

Si vous trouvez des bugs, documentez-les ici :

### Bug #1
- **Titre** : _______
- **Sévérité** : Critique / Majeure / Mineure
- **Étapes de reproduction** :
  1. _______
  2. _______
- **Résultat attendu** : _______
- **Résultat obtenu** : _______
- **Screenshots** : _______

### Bug #2
...

---

## ✅ APPROBATION FINALE

### Checklist Pré-Production

- [ ] Tous les tests critiques passent (95%+)
- [ ] Aucun bug bloquant trouvé
- [ ] Performance acceptable (<3s chargement pages)
- [ ] Sécurité validée (rate limiting, CORS, headers)
- [ ] Tests sur navigateurs multiples (Chrome, Firefox, Safari)
- [ ] Tests mobile responsive (iPhone, Android)
- [ ] Logs correctement configurés (Winston)
- [ ] Sentry configuré et testé
- [ ] Backups database configurés
- [ ] Variables d'environnement production prêtes

### Signatures

**Testeur** : ___________________
**Date** : ___________________
**Approuvé pour production** : ☐ Oui ☐ Non (raison : _________)

---

**FIN DU GUIDE DE TESTS MANUELS**

Pour toute question, consulter [PRODUCTION_READINESS_REPORT.md](./PRODUCTION_READINESS_REPORT.md)
