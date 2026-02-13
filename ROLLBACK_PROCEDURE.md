# Procédure de Rollback - Fresha-Clone-Project

**Version** : 1.0
**Date** : 11 Janvier 2026
**Criticité** : HAUTE - Document d'urgence

---

## 🚨 QUAND UTILISER CE DOCUMENT

Utilisez cette procédure si vous devez annuler un déploiement en production à cause de :

- ❌ Bugs critiques détectés après déploiement
- ❌ Performance dégradée significativement
- ❌ Erreurs massives dans Sentry
- ❌ Perte de fonctionnalités critiques
- ❌ Problèmes de sécurité découverts
- ❌ Migration database échouée

---

## ⏱️ TEMPS DE ROLLBACK ESTIMÉS

| Composant | Temps estimé | Difficulté |
|-----------|--------------|------------|
| Backend (Render) | 5-10 minutes | Facile |
| Frontend Employés (Vercel) | 2-5 minutes | Très facile |
| Frontend Clients (Vercel) | 2-5 minutes | Très facile |
| Database (Neon) | 10-30 minutes | Moyenne |
| **Total complet** | **20-50 minutes** | - |

---

## 📋 CHECKLIST PRÉ-ROLLBACK

Avant de lancer un rollback, vérifier :

- [ ] **Identifier la version stable précédente**
  - Git commit SHA : `_________________`
  - Date du dernier déploiement stable : `_________________`
  - Build ID Render : `_________________`
  - Deployment ID Vercel : `_________________`

- [ ] **Évaluer l'impact**
  - Nombre d'utilisateurs affectés : `_________________`
  - Données perdues si rollback : `_________________`
  - Réservations en cours : `_________________`

- [ ] **Informer l'équipe**
  - [ ] Équipe technique notifiée
  - [ ] Clients/utilisateurs informés (si nécessaire)
  - [ ] Message de maintenance affiché

- [ ] **Backup récent de la database disponible**
  - [ ] Backup < 24h existe
  - [ ] Backup testé et validé

---

## 🔄 PROCÉDURE DE ROLLBACK COMPLÈTE

### ÉTAPE 1 : Activer le Mode Maintenance (5 min)

#### 1.1 Backend - Page de Maintenance

**Si possible, déployer rapidement une page de maintenance** :

```bash
# Créer une branche maintenance
git checkout -b emergency-maintenance

# Modifier app.ts pour retourner 503 Service Unavailable
```

**Ou via Render Dashboard** :

1. Aller sur https://dashboard.render.com
2. Sélectionner votre service backend
3. Onglet "Settings"
4. Section "Health Check Path"
5. Modifier temporairement pour échouer (ou suspendre le service)

#### 1.2 Frontends - Message de Maintenance

**Créer une page maintenance.html** :

```html
<!DOCTYPE html>
<html>
<head>
  <title>Maintenance en cours</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .container {
      text-align: center;
      padding: 2rem;
    }
    h1 { font-size: 3rem; margin: 0; }
    p { font-size: 1.2rem; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔧 Maintenance en cours</h1>
    <p>Nous effectuons une maintenance urgente.</p>
    <p>Le service sera rétabli sous peu.</p>
    <p><small>Temps estimé : 30 minutes</small></p>
  </div>
</body>
</html>
```

**Déployer sur Vercel** :

```bash
# Commit rapide
git add .
git commit -m "chore: emergency maintenance page"
git push origin main

# Vercel déploiera automatiquement
```

---

### ÉTAPE 2 : Rollback Backend (10 min)

#### Méthode A : Rollback via Render Dashboard (RECOMMANDÉ - Plus Rapide)

1. **Accéder à Render**
   - URL : https://dashboard.render.com
   - Se connecter

2. **Sélectionner le service backend**
   - Cliquer sur votre service "fresha-backend" (ou nom)

3. **Onglet "Events"**
   - Voir l'historique des déploiements
   - Identifier le dernier déploiement stable (date, commit)

4. **Rollback en 1 clic**
   - Cliquer sur le bouton "Rollback" à côté du déploiement stable
   - **OU** aller dans "Manual Deploy" :
     - Branch : `main`
     - Commit : `<SHA du commit stable>`
     - Cliquer "Deploy"

5. **Attendre le déploiement**
   - Build time : ~3-5 minutes
   - Surveiller les logs en temps réel
   - Vérifier "Deploy succeeded"

6. **Tester le health check**
   ```bash
   curl https://votre-backend.onrender.com/health

   # Attendu :
   {
     "status": "healthy",
     "timestamp": "...",
     ...
   }
   ```

#### Méthode B : Rollback via Git + Redéploiement

**Si Render dashboard ne fonctionne pas** :

```bash
# 1. Revenir au commit stable dans Git
git log --oneline  # Trouver le SHA stable

# 2. Créer une branche de rollback
git checkout -b rollback-emergency <COMMIT_SHA>

# 3. Force push sur main (ATTENTION : destructif)
git checkout main
git reset --hard <COMMIT_SHA>
git push origin main --force

# Render détectera le push et redéploiera automatiquement
```

⚠️ **ATTENTION** : `--force` écrase l'historique ! À utiliser en dernier recours.

---

### ÉTAPE 3 : Rollback Frontend Employés (5 min)

#### Via Vercel Dashboard

1. **Accéder à Vercel**
   - URL : https://vercel.com/dashboard
   - Se connecter

2. **Sélectionner le projet** : `fresha-employee-app` (ou nom)

3. **Onglet "Deployments"**
   - Liste de tous les déploiements
   - Identifier le dernier stable (date + commit)

4. **Promouvoir le déploiement stable**
   - Cliquer sur les 3 points `...` à droite du déploiement
   - Sélectionner "Promote to Production"
   - Confirmer

5. **Vérifier immédiatement**
   - Ouvrir https://votre-app-employee.vercel.app
   - Tester connexion
   - Vérifier console (pas d'erreurs JS)

#### Via CLI Vercel (Alternative)

```bash
# 1. Installer Vercel CLI si pas déjà fait
npm i -g vercel

# 2. Se connecter
vercel login

# 3. Lister les déploiements
vercel ls fresha-employee-app

# 4. Promouvoir un déploiement spécifique
vercel promote <DEPLOYMENT_URL> --scope=<TEAM_NAME>
```

---

### ÉTAPE 4 : Rollback Frontend Clients (5 min)

**Même procédure que Frontend Employés** :

1. Vercel Dashboard > Projet `fresha-client-app`
2. Deployments > Trouver déploiement stable
3. Promote to Production
4. Tester https://votre-app-client.vercel.app

---

### ÉTAPE 5 : Rollback Database (20-30 min) ⚠️ CRITIQUE

**⚠️ ATTENTION : Le rollback database est IRRÉVERSIBLE. Sauvegarder d'abord !**

#### 5.1 Créer un Snapshot de la DB Actuelle (Sécurité)

**Avant toute action** :

1. Neon Console > Branches
2. Create branch
3. Name : `emergency-snapshot-before-rollback-$(date +%Y%m%d)`
4. From : `main`
5. Create

**Cela prend 2-3 minutes** - NE PAS SAUTER CETTE ÉTAPE !

#### 5.2 Évaluer le Besoin de Rollback Database

**Rollback DB nécessaire si** :
- ✅ Migration Prisma a cassé le schéma
- ✅ Données corrompues massivement
- ✅ Perte de données critiques

**Rollback DB PAS nécessaire si** :
- ❌ Bug uniquement dans le code (backend/frontend)
- ❌ Problème de configuration
- ❌ Problème de performance (régler autrement)

**Si rollback DB non nécessaire, PASSER À L'ÉTAPE 6**

#### 5.3 Rollback Database via Point-in-Time Recovery

**Cas d'usage** : Restaurer DB à un moment précis (avant incident)

1. **Identifier le timestamp exact**
   ```
   Date de l'incident : _____________________
   Heure de l'incident : _____________________
   Timestamp cible (5-10 min avant) : _____________________
   ```

2. **Créer une branche restaurée**
   - Neon Console > Branches
   - Create branch
   - Name : `rollback-to-<DATE>-<TIME>`
   - From : Point in time
   - Date/Time : `<TIMESTAMP CIBLE>`
   - Create

3. **Attendre la création** (5-10 minutes pour grandes DB)

4. **Tester la branche restaurée**
   ```bash
   # Connection string de la branche restaurée
   ROLLBACK_DB="postgresql://user:pass@rollback-branch.neon.tech/db"

   # Vérifier les données
   psql $ROLLBACK_DB -c "SELECT COUNT(*) FROM booking;"
   psql $ROLLBACK_DB -c "SELECT COUNT(*) FROM salon;"
   psql $ROLLBACK_DB -c "SELECT * FROM salon LIMIT 5;"

   # Vérifier intégrité
   psql $ROLLBACK_DB -c "SELECT COUNT(*) FROM information_schema.tables;"
   ```

5. **Si les données sont OK, promouvoir la branche**

   **⚠️ POINT DE NON-RETOUR ⚠️**

   - Neon Console > Branche `rollback-to-...`
   - Bouton "Set as Primary"
   - **Confirmer** (cela remplacera la branche `main`)

6. **Mettre à jour DATABASE_URL**

   **Render** :
   - Dashboard > Service Backend > Environment
   - Modifier `DATABASE_URL` avec la nouvelle connection string
   - Redéployer le service

   **Localement** :
   ```bash
   # .env
   DATABASE_URL="postgresql://user:pass@new-primary.neon.tech/db"
   ```

---

### ÉTAPE 6 : Vérification Post-Rollback (10 min)

#### 6.1 Backend Checks

```bash
# Health check
curl https://votre-backend.onrender.com/health

# Test authentification
curl -X POST https://votre-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password"}'

# Test liste salons
curl https://votre-backend.onrender.com/api/salons
```

**Critères de succès** :
- [ ] Health check retourne 200
- [ ] Auth fonctionne
- [ ] Requêtes API répondent correctement
- [ ] Logs dans Render ne montrent pas d'erreurs

#### 6.2 Frontend Employés Checks

1. [ ] Ouvrir https://votre-app-employee.vercel.app
2. [ ] Se connecter avec un compte owner
3. [ ] Naviguer vers Dashboard
4. [ ] Vérifier que les données s'affichent
5. [ ] Tester création d'une réservation

#### 6.3 Frontend Clients Checks

1. [ ] Ouvrir https://votre-app-client.vercel.app
2. [ ] Page d'accueil charge sans erreurs
3. [ ] Flow de réservation accessible
4. [ ] Sélection salon/service fonctionne

#### 6.4 Database Checks

```bash
# Connexion à la DB
psql $DATABASE_URL

# Vérifier les tables critiques
SELECT COUNT(*) FROM salon;
SELECT COUNT(*) FROM booking WHERE status = 'CONFIRMED';
SELECT COUNT(*) FROM staff WHERE "isActive" = true;

# Vérifier les contraintes FK
SELECT * FROM information_schema.table_constraints
WHERE constraint_type = 'FOREIGN KEY';

# Vérifier dernières réservations
SELECT * FROM booking
ORDER BY "createdAt" DESC
LIMIT 10;
```

**Critères de succès** :
- [ ] Toutes les tables existent
- [ ] Données cohérentes
- [ ] Pas de contraintes FK cassées
- [ ] Dernières réservations visibles

---

### ÉTAPE 7 : Désactiver Mode Maintenance (5 min)

#### 7.1 Réactiver Backend (si suspendu)

- Render Dashboard > Service > "Resume Service"

#### 7.2 Retirer Page de Maintenance Frontends

**Si page maintenance déployée** :

```bash
# Revenir au code stable
git checkout main
git pull origin main

# Déployer (Vercel auto-deploy)
git push origin main
```

#### 7.3 Annoncer Retour à la Normale

**Email/Message aux utilisateurs** :

```
Objet : Service rétabli - Fresha Clone

Bonjour,

La maintenance d'urgence est terminée.
Le service est à nouveau opérationnel.

Nous nous excusons pour la gêne occasionnée.

Merci de votre patience.

L'équipe Fresha Clone
```

---

### ÉTAPE 8 : Post-Mortem & Documentation (30 min - À FAIRE LE LENDEMAIN)

#### 8.1 Créer un Incident Report

**Template** :

```markdown
# Incident Report - [DATE]

## Résumé
- **Date/Heure incident** : _________________
- **Durée downtime** : _________________
- **Utilisateurs affectés** : _________________
- **Rollback effectué** : ☐ Oui ☐ Non

## Chronologie
- [HH:MM] Déploiement version X.Y.Z
- [HH:MM] Première alerte (Sentry/utilisateur)
- [HH:MM] Décision de rollback
- [HH:MM] Rollback backend complété
- [HH:MM] Rollback frontends complété
- [HH:MM] Service restauré

## Cause Racine
[Expliquer ce qui a causé le problème]

## Actions Correctives
1. [ ] Fix du bug identifié
2. [ ] Tests supplémentaires ajoutés
3. [ ] Documentation mise à jour
4. [ ] Procédure de déploiement améliorée

## Leçons Apprises
- _____________________
- _____________________

## Action Items
- [ ] Implémenter [SOLUTION] - Assigné à: _____ - Deadline: _____
- [ ] Ajouter tests [TYPE] - Assigné à: _____ - Deadline: _____
```

#### 8.2 Analyser les Logs

**Sentry** :
- Identifier tous les erreurs survenues pendant l'incident
- Créer des issues GitHub pour chaque bug

**Render Logs** :
```bash
# Via CLI (si configuré)
render logs --service=<SERVICE_ID> --since=2h
```

**Winston Logs** (si logs sauvegardés) :
```bash
# Analyser les logs d'erreur
grep "ERROR" logs/error-2026-01-11.log
```

#### 8.3 Mise à Jour Documentation

- [ ] Mettre à jour CHANGELOG.md
- [ ] Documenter la procédure de rollback si améliorations
- [ ] Partager incident report avec l'équipe

---

## 🚨 CONTACTS D'URGENCE

### Équipe Technique
- **Lead Dev** : _____________________ (Téléphone : _______)
- **DevOps** : _____________________ (Téléphone : _______)
- **DBA** : _____________________ (Téléphone : _______)

### Support Plateforme
- **Render Support** : https://render.com/support
- **Vercel Support** : https://vercel.com/support
- **Neon Support** : https://console.neon.tech/support

### Escalade
Si rollback échoue après 2 tentatives :
1. Contacter Lead Dev immédiatement
2. Ouvrir ticket support Render/Vercel
3. Documenter toutes les étapes tentées

---

## 📊 CHECKLIST FINALE POST-ROLLBACK

- [ ] Backend stable et accessible
- [ ] Frontend employés fonctionnel
- [ ] Frontend clients fonctionnel
- [ ] Database intègre (données cohérentes)
- [ ] Health checks passent
- [ ] Logs ne montrent pas d'erreurs critiques
- [ ] Sentry ne reçoit plus d'erreurs massives
- [ ] Mode maintenance désactivé
- [ ] Utilisateurs informés
- [ ] Incident report créé
- [ ] Post-mortem meeting planifié

---

## 🔒 PRÉVENTION DES FUTURS INCIDENTS

### Tests Pré-Déploiement Obligatoires

Avant TOUT déploiement production :

1. [ ] Tests automatisés passent (CI/CD)
2. [ ] Tests manuels critiques effectués (cf. MANUAL_TESTING_GUIDE.md)
3. [ ] Revue de code (peer review) effectuée
4. [ ] Migration database testée sur staging
5. [ ] Backup database récent (< 24h)
6. [ ] Rollback plan documenté pour cette release
7. [ ] Monitoring Sentry actif
8. [ ] Logs Winston activés

### Déploiement Progressif (Recommandé)

**Phase 1 : Staging** (1 jour)
- Déployer sur environnement staging
- Tester toutes les fonctionnalités
- Monitoring 24h

**Phase 2 : Production Limitée** (1-2 jours)
- Déployer en production
- Limiter accès à 10-20% des utilisateurs (feature flags)
- Monitoring intensif
- Rollback immédiat si problème

**Phase 3 : Production Complète**
- Ouvrir à 100% des utilisateurs
- Monitoring continu

---

## 📝 HISTORIQUE DES ROLLBACKS

Documenter chaque rollback effectué :

### Rollback #1
- **Date** : _____________________
- **Raison** : _____________________
- **Version rollback** : _____________________
- **Durée downtime** : _____________________
- **Leçon apprise** : _____________________

---

**FIN DE LA PROCÉDURE DE ROLLBACK**

**Dernière révision** : 11 Janvier 2026
**Prochaine révision** : Après chaque incident ou trimestriel

**En cas de doute ou de problème critique, TOUJOURS préférer un rollback rapide à un debugging prolongé en production.**
