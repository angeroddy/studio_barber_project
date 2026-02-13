# Test de la Contrainte : Une Seule Réservation en Cours par Client

## Résumé de l'Implémentation

### Objectif
Empêcher un client d'avoir plusieurs réservations en cours simultanément. Un client ne peut avoir qu'une seule réservation avec un statut actif (PENDING, CONFIRMED, ou IN_PROGRESS) et dont la date de fin n'est pas encore passée.

### Modifications Apportées

#### Backend - Service de Réservation Client
**Fichier**: `backend_fresha/src/services/clientBooking.service.ts`

**Changements** :
1. Ajout d'une vérification dans `createClientBooking()` (ligne 36-68)
2. Ajout de la même vérification dans `createClientMultiServiceBooking()` (ligne 444-476)

**Logique de vérification** :
- Recherche une réservation existante pour le client où :
  - `endTime > now` (la réservation n'est pas encore passée)
  - `status IN ['PENDING', 'CONFIRMED', 'IN_PROGRESS']` (réservation active)
- Si une telle réservation existe, lance une erreur détaillée avec :
  - Le nom du salon
  - La date de la réservation existante
  - L'heure de la réservation existante

#### Frontend - Gestion des Erreurs
**Fichiers concernés** :
- `front_client/front_client_sb/app/reserver/valider/page.tsx` (lignes 355-360)
- `front_client/front_client_sb/lib/api/config.ts` (lignes 79-84)

**Comportement** :
- Les erreurs du backend sont automatiquement capturées
- Le message d'erreur est affiché dans une div rouge avec un style clair
- Aucune modification du code frontend n'a été nécessaire (déjà géré)

---

## Plan de Test

### Prérequis
1. Serveur backend démarré
2. Application frontend client démarrée
3. Base de données accessible
4. Un compte client créé et testé

---

## Scénarios de Test

### ✅ Scénario 1 : Première Réservation (Succès)

**Objectif** : Vérifier qu'un client peut créer sa première réservation

**Étapes** :
1. Se connecter en tant que client
2. Sélectionner un salon
3. Choisir une prestation
4. Sélectionner un professionnel
5. Choisir une date et heure FUTURES
6. Valider la réservation

**Résultat attendu** :
- ✅ La réservation est créée avec succès
- ✅ Redirection vers la page de confirmation
- ✅ La réservation apparaît dans "Mes réservations"

---

### ❌ Scénario 2 : Deuxième Réservation Bloquée (Échec Attendu)

**Objectif** : Vérifier qu'un client ne peut pas créer une deuxième réservation

**Étapes** :
1. **Prérequis** : Le client a déjà une réservation en cours (du Scénario 1)
2. Tenter de créer une nouvelle réservation :
   - Sélectionner un salon (même ou différent)
   - Choisir une prestation
   - Sélectionner un professionnel
   - Choisir une date et heure DIFFÉRENTES de la première
3. Cliquer sur "Valider"

**Résultat attendu** :
- ❌ La réservation est **REFUSÉE**
- ❌ Un message d'erreur s'affiche :
  ```
  Vous avez déjà une réservation en cours chez [Nom du Salon] le [Date] à [Heure].
  Veuillez annuler ou attendre que cette réservation soit passée avant d'en créer une nouvelle.
  ```
- ❌ Le client reste sur la page de validation
- ❌ Aucune nouvelle réservation n'est créée dans la base de données

---

### ✅ Scénario 3 : Réservation Après Annulation (Succès)

**Objectif** : Vérifier qu'un client peut réserver après avoir annulé sa réservation précédente

**Étapes** :
1. **Prérequis** : Le client a une réservation en cours
2. Aller dans "Mes réservations"
3. Annuler la réservation en cours (statut devient CANCELED)
4. Créer une nouvelle réservation :
   - Sélectionner un salon
   - Choisir une prestation
   - Sélectionner un professionnel
   - Choisir une date et heure futures
5. Valider la réservation

**Résultat attendu** :
- ✅ La réservation est créée avec succès
- ✅ Redirection vers la page de confirmation

---

### ✅ Scénario 4 : Réservation Après Expiration (Succès)

**Objectif** : Vérifier qu'un client peut réserver après que sa réservation précédente soit passée

**Étapes** :
1. **Configuration de test** :
   - Créer une réservation avec une date/heure PASSÉE
   - OU attendre que la réservation existante soit passée (endTime < now)
2. Créer une nouvelle réservation :
   - Sélectionner un salon
   - Choisir une prestation
   - Sélectionner un professionnel
   - Choisir une date et heure futures
3. Valider la réservation

**Résultat attendu** :
- ✅ La réservation est créée avec succès
- ✅ Redirection vers la page de confirmation
- ℹ️ L'ancienne réservation (passée) ne bloque plus

---

### ✅ Scénario 5 : Réservation Multi-Services (Même Contrainte)

**Objectif** : Vérifier que la contrainte s'applique aussi aux réservations multi-services

**Étapes** :
1. **Prérequis** : Le client a déjà une réservation simple en cours
2. Tenter de créer une réservation multi-services :
   - Sélectionner un salon
   - Choisir **PLUSIEURS** prestations
   - Sélectionner des professionnels
   - Choisir une date et heure
3. Cliquer sur "Valider"

**Résultat attendu** :
- ❌ La réservation est **REFUSÉE**
- ❌ Le même message d'erreur s'affiche

---

### ✅ Scénario 6 : Statut IN_PROGRESS ou COMPLETED

**Objectif** : Vérifier le comportement avec différents statuts

**Étapes** :
1. **Test A - Réservation IN_PROGRESS** :
   - Modifier manuellement le statut d'une réservation en `IN_PROGRESS`
   - Tenter de créer une nouvelle réservation
   - **Résultat** : ❌ Bloqué (IN_PROGRESS est un statut actif)

2. **Test B - Réservation COMPLETED** :
   - Modifier le statut d'une réservation en `COMPLETED`
   - Tenter de créer une nouvelle réservation
   - **Résultat** : ✅ Autorisé (COMPLETED n'est plus actif)

3. **Test C - Réservation NO_SHOW** :
   - Modifier le statut d'une réservation en `NO_SHOW`
   - Tenter de créer une nouvelle réservation
   - **Résultat** : ✅ Autorisé (NO_SHOW n'est plus actif)

---

## Tests Techniques (Optionnel)

### Test API Direct

**Endpoint** : `POST /api/client-bookings`

**Headers** :
```json
{
  "Authorization": "Bearer <token_client>",
  "Content-Type": "application/json"
}
```

**Body** :
```json
{
  "salonId": "uuid-du-salon",
  "serviceId": "uuid-du-service",
  "staffId": "uuid-du-staff",
  "startTime": "2026-02-15T10:00:00.000Z",
  "notes": "Test de réservation"
}
```

**Test 1 - Première réservation** :
- **Statut attendu** : `201 Created`
- **Réponse** :
```json
{
  "success": true,
  "message": "Réservation créée avec succès",
  "data": { /* ... */ }
}
```

**Test 2 - Deuxième réservation (client a déjà une réservation en cours)** :
- **Statut attendu** : `400 Bad Request`
- **Réponse** :
```json
{
  "success": false,
  "error": "Vous avez déjà une réservation en cours chez [Salon] le [Date] à [Heure]. Veuillez annuler ou attendre que cette réservation soit passée avant d'en créer une nouvelle."
}
```

---

## Vérifications en Base de Données

### Requête SQL pour vérifier les réservations actives d'un client

```sql
SELECT
  id,
  "startTime",
  "endTime",
  status,
  "salonId"
FROM "Booking"
WHERE "clientId" = '<uuid-du-client>'
  AND "endTime" > NOW()
  AND status IN ('PENDING', 'CONFIRMED', 'IN_PROGRESS')
ORDER BY "startTime" DESC;
```

**Résultat attendu** :
- Pour Scénario 1 : 1 réservation active
- Pour Scénario 2 : Toujours 1 réservation active (la nouvelle est rejetée)
- Pour Scénario 3 : 1 réservation active (la nouvelle, l'ancienne est CANCELED)

---

## Checklist de Validation

- [ ] Scénario 1 : Première réservation réussie
- [ ] Scénario 2 : Deuxième réservation bloquée avec message d'erreur approprié
- [ ] Scénario 3 : Réservation possible après annulation
- [ ] Scénario 4 : Réservation possible après expiration
- [ ] Scénario 5 : Contrainte appliquée aux réservations multi-services
- [ ] Scénario 6 : Comportement correct pour tous les statuts
- [ ] Message d'erreur bien formaté et informatif
- [ ] Aucune réservation en double créée dans la base de données
- [ ] Les réservations passées ne bloquent pas de nouvelles réservations

---

## Notes Importantes

1. **Statuts Actifs** : PENDING, CONFIRMED, IN_PROGRESS
2. **Statuts Inactifs** : CANCELED, COMPLETED, NO_SHOW
3. **Critère de Blocage** : `endTime > now` ET `status IN ['PENDING', 'CONFIRMED', 'IN_PROGRESS']`
4. **Message d'Erreur** : Inclut le nom du salon, la date et l'heure de la réservation existante
5. **Application** : La contrainte s'applique aux réservations simples ET multi-services

---

## Correction des Bugs Potentiels

Si le test échoue, vérifier :
1. ✅ Le token d'authentification est valide
2. ✅ Le `clientId` est correctement extrait du token
3. ✅ Les statuts de réservation correspondent bien aux enum dans `schema.prisma`
4. ✅ Le fuseau horaire est cohérent entre frontend et backend
5. ✅ Le service backend a bien été redémarré après les modifications
