# Guide de Configuration des Backups Neon Cloud

## 📋 Vue d'ensemble

Ce guide explique comment configurer et gérer les sauvegardes (backups) de votre base de données PostgreSQL hébergée sur Neon Cloud.

---

## 🔧 Configuration des Backups Automatiques

### Étape 1 : Accéder à votre Dashboard Neon

1. Connectez-vous sur [https://console.neon.tech](https://console.neon.tech)
2. Sélectionnez votre projet Fresha-Clone
3. Naviguez vers votre base de données

### Étape 2 : Configurer les Backups

#### Option 1 : Plan Gratuit (Free Tier)

**Limitations** :
- Point-in-time restore : 7 jours
- Backups automatiques quotidiens
- Pas de configuration manuelle nécessaire

**Ce qui est inclus automatiquement** :
- ✅ Backups quotidiens automatiques
- ✅ Restore possible jusqu'à 7 jours en arrière
- ✅ Stockage des WAL (Write-Ahead Logs)
- ❌ Pas de snapshots manuels illimités

#### Option 2 : Plan Pro (Recommandé pour Production)

**Avantages** :
- Point-in-time restore : 30 jours
- Backups automatiques avec plus de flexibilité
- Snapshots manuels à la demande
- Meilleure performance et stockage

**Configuration** :

1. **Dans Neon Console > Settings > Backups** :
   ```
   - Point-in-time restore: 30 days
   - Automatic snapshots: Daily at 2:00 AM UTC
   - Retention period: 30 days
   ```

2. **Activer les notifications** :
   - Settings > Notifications
   - Cocher "Backup failures"
   - Ajouter votre email

### Étape 3 : Créer un Backup Manuel (Snapshot)

**Via l'interface Neon** :

1. Aller dans votre projet
2. Cliquer sur "Branches" dans le menu latéral
3. Cliquer sur "Create branch"
4. Options :
   ```
   Branch name: backup-YYYY-MM-DD
   From: main
   Point in time: Current timestamp
   ```
5. Cliquer sur "Create"

**Via l'API Neon** (pour automatisation) :

```bash
curl -X POST \
  https://console.neon.tech/api/v2/projects/{project_id}/branches \
  -H "Authorization: Bearer $NEON_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "branch": {
      "name": "backup-'$(date +%Y-%m-%d-%H%M%S)'",
      "parent_id": "main"
    }
  }'
```

---

## 📥 Restauration d'un Backup

### Méthode 1 : Point-in-Time Recovery (PITR)

**Cas d'usage** : Restaurer la DB à un moment précis (ex: avant une erreur)

1. Dans Neon Console, aller dans "Branches"
2. Cliquer sur "Create branch"
3. Sélectionner "Point in time"
4. Choisir la date et l'heure exacte
5. Nommer la branche (ex: `restore-after-incident`)
6. Créer la branche

**Tester la restauration** :

```bash
# 1. Récupérer la connection string de la branche restaurée
DATABASE_URL="postgresql://user:pass@branch-name.neon.tech/db"

# 2. Vérifier les données
psql $DATABASE_URL -c "SELECT COUNT(*) FROM booking;"
psql $DATABASE_URL -c "SELECT * FROM salon LIMIT 5;"
```

**Promouvoir la branche restaurée en main** :

1. Si les données sont correctes, dans Neon Console :
2. Aller sur la branche restaurée
3. Cliquer sur "Set as primary"
4. Confirmer l'action

⚠️ **ATTENTION** : Cela remplacera votre branche principale !

### Méthode 2 : Restauration depuis un Snapshot Manuel

1. Aller dans "Branches"
2. Trouver votre snapshot (ex: `backup-2026-01-11`)
3. Créer une nouvelle branche depuis ce snapshot
4. Tester et promouvoir si OK

---

## 🤖 Automatisation des Backups (Recommandé)

### Script de Backup Automatique

Créer un script pour automatiser les backups réguliers :

**backup.sh** :

```bash
#!/bin/bash

# Configuration
NEON_API_KEY="your_neon_api_key"
PROJECT_ID="your_project_id"
BACKUP_PREFIX="auto-backup"
TIMESTAMP=$(date +%Y-%m-%d-%H%M%S)

# Créer un snapshot via l'API
curl -X POST \
  "https://console.neon.tech/api/v2/projects/${PROJECT_ID}/branches" \
  -H "Authorization: Bearer ${NEON_API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"branch\": {
      \"name\": \"${BACKUP_PREFIX}-${TIMESTAMP}\",
      \"parent_id\": \"main\"
    }
  }" | jq .

echo "✅ Backup créé: ${BACKUP_PREFIX}-${TIMESTAMP}"
```

**Rendre le script exécutable** :

```bash
chmod +x backup.sh
```

**Automatiser avec Cron** (Linux/Mac) :

```bash
# Ouvrir crontab
crontab -e

# Ajouter cette ligne pour un backup quotidien à 3h du matin
0 3 * * * /chemin/vers/backup.sh >> /var/log/neon-backup.log 2>&1
```

**Automatiser avec GitHub Actions** :

```yaml
# .github/workflows/neon-backup.yml
name: Neon Database Backup

on:
  schedule:
    # Tous les jours à 3h UTC
    - cron: '0 3 * * *'
  workflow_dispatch: # Permet de lancer manuellement

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - name: Create Neon Backup
        env:
          NEON_API_KEY: ${{ secrets.NEON_API_KEY }}
          PROJECT_ID: ${{ secrets.NEON_PROJECT_ID }}
        run: |
          TIMESTAMP=$(date +%Y-%m-%d-%H%M%S)
          curl -X POST \
            "https://console.neon.tech/api/v2/projects/${PROJECT_ID}/branches" \
            -H "Authorization: Bearer ${NEON_API_KEY}" \
            -H "Content-Type: application/json" \
            -d "{
              \"branch\": {
                \"name\": \"github-backup-${TIMESTAMP}\",
                \"parent_id\": \"main\"
              }
            }"
```

---

## 🧹 Nettoyage des Anciens Backups

Pour économiser l'espace de stockage, supprimer régulièrement les vieux backups :

**Via l'API Neon** :

```bash
#!/bin/bash

# Lister toutes les branches
curl -X GET \
  "https://console.neon.tech/api/v2/projects/${PROJECT_ID}/branches" \
  -H "Authorization: Bearer ${NEON_API_KEY}" | jq '.branches[] | select(.name | startswith("backup-")) | .id'

# Supprimer une branche spécifique
curl -X DELETE \
  "https://console.neon.tech/api/v2/projects/${PROJECT_ID}/branches/${BRANCH_ID}" \
  -H "Authorization: Bearer ${NEON_API_KEY}"
```

**Script de nettoyage automatique** :

```bash
#!/bin/bash
# Garder seulement les 30 derniers backups manuels

# TODO: Implémenter la logique de suppression des branches > 30 jours
```

---

## 📊 Vérification de l'Intégrité des Backups

### Test Mensuel Recommandé

**Checklist de vérification** :

```bash
# 1. Créer une branche de test depuis un backup récent
# 2. Se connecter à cette branche
psql $TEST_DATABASE_URL

# 3. Vérifier l'intégrité des données
SELECT COUNT(*) FROM salon;
SELECT COUNT(*) FROM booking;
SELECT COUNT(*) FROM staff;
SELECT COUNT(*) FROM client;

# 4. Vérifier les contraintes
SELECT * FROM information_schema.table_constraints
WHERE constraint_type = 'FOREIGN KEY';

# 5. Tester une requête métier
SELECT s.name, COUNT(b.id) as total_bookings
FROM salon s
LEFT JOIN booking b ON s.id = b."salonId"
GROUP BY s.name;

# 6. Si OK, supprimer la branche de test
```

---

## 🚨 Plan de Reprise d'Activité (Disaster Recovery)

### Scénario 1 : Suppression Accidentelle de Données

**Temps de récupération estimé** : 5-10 minutes

```bash
# 1. Identifier l'heure exacte de l'incident
INCIDENT_TIME="2026-01-11 14:30:00"

# 2. Créer une branche juste avant l'incident
# Via Neon Console > Branches > Create > Point in time

# 3. Vérifier les données restaurées

# 4. Promouvoir la branche si OK
```

### Scénario 2 : Corruption de Base de Données

**Temps de récupération estimé** : 10-20 minutes

1. Créer une nouvelle branche depuis le dernier snapshot valide
2. Exporter les données critiques récentes de la branche corrompue (si possible)
3. Importer dans la branche restaurée
4. Promouvoir la branche restaurée

### Scénario 3 : Perte Complète de l'Instance Neon

**Prévention** : Exporter régulièrement vers un stockage externe

```bash
# Export complet de la DB (à faire 1x/semaine)
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Compresser
gzip backup_$(date +%Y%m%d).sql

# Uploader vers S3, Google Cloud Storage, etc.
aws s3 cp backup_$(date +%Y%m%d).sql.gz s3://your-bucket/backups/
```

---

## 📝 Checklist de Production

Avant de passer en production, vérifier :

- [ ] Backups automatiques activés (quotidiens minimum)
- [ ] Point-in-time restore configuré (7 ou 30 jours)
- [ ] Snapshots manuels créés avant chaque migration majeure
- [ ] Notifications d'échec de backup activées
- [ ] Test de restauration effectué au moins 1x
- [ ] Script d'export vers stockage externe configuré
- [ ] Documentation des procédures de recovery accessible à l'équipe
- [ ] Contact d'urgence Neon Support noté (pour plan Pro)

---

## 📞 Support et Ressources

- **Documentation Neon** : https://neon.tech/docs/introduction
- **API Reference** : https://neon.tech/docs/reference/api-reference
- **Support Neon** : [console.neon.tech/support](https://console.neon.tech/support)
- **Status Page** : https://neon.tech/status

---

**Dernière mise à jour** : 11 Janvier 2026
**Fréquence de révision** : Trimestrielle
