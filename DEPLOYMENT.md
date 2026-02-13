# Guide de Déploiement - Fresha Clone Project

Ce guide vous explique comment déployer votre application pour que vos clients puissent la tester.

## Architecture de l'application

- **Backend**: Express.js + TypeScript + Prisma (PostgreSQL)
- **Frontend**: Next.js 16 + React 19
- **Base de données**: PostgreSQL (Neon Cloud - déjà hébergée)

---

## Option 1: Déploiement Rapide (RECOMMANDÉ)

Cette option utilise des services gratuits et est la plus simple pour un test client.

### Backend → Render.com (Gratuit)
### Frontend → Vercel (Gratuit)

---

## ÉTAPE 1: Déployer le Backend sur Render.com

### 1.1 Créer un compte Render

1. Aller sur [https://render.com](https://render.com)
2. Cliquer sur "Get Started" et créer un compte (avec GitHub de préférence)

### 1.2 Connecter votre dépôt GitHub

**Si votre code n'est pas encore sur GitHub:**

```bash
# Dans le dossier racine du projet
git init
git add .
git commit -m "Initial commit for deployment"

# Créer un nouveau dépôt sur GitHub, puis:
git remote add origin https://github.com/VOTRE_USERNAME/fresha-clone.git
git branch -M main
git push -u origin main
```

### 1.3 Créer un nouveau Web Service sur Render

1. Dans le dashboard Render, cliquer sur "New +" → "Web Service"
2. Connecter votre dépôt GitHub
3. Sélectionner votre projet `Fresha-Clone-Project`

### 1.4 Configuration du service Backend

**Paramètres à configurer:**

| Champ | Valeur |
|-------|--------|
| **Name** | `fresha-backend` (ou votre nom) |
| **Region** | Europe (Frankfurt) ou le plus proche |
| **Branch** | `main` |
| **Root Directory** | `backend_fresha` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npx prisma generate && npm run build` |
| **Start Command** | `npm start` |
| **Plan** | Free |

### 1.5 Variables d'environnement Backend

Cliquer sur "Advanced" → "Add Environment Variable" et ajouter:

| Clé | Valeur |
|-----|--------|
| `DATABASE_URL` | `postgresql://neondb_owner:npg_xP8cICgFeyH9@ep-rapid-mountain-abzgzzcw-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require` |
| `JWT_SECRET` | Générer une clé secrète longue (ex: `votre_secret_super_long_et_securise_123456`) |
| `JWT_EXPIRES_IN` | `7d` |
| `REFRESH_TOKEN_SECRET` | Générer une autre clé secrète différente |
| `NODE_ENV` | `production` |
| `PORT` | `5000` |

**💡 Astuce**: Pour générer des secrets sécurisés:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 1.6 Déployer

1. Cliquer sur "Create Web Service"
2. Attendre 3-5 minutes que le déploiement se termine
3. Noter l'URL de votre backend (ex: `https://fresha-backend.onrender.com`)

**⚠️ Note importante**: Le plan gratuit de Render met le service en veille après 15 minutes d'inactivité. Le premier accès peut prendre 30-60 secondes.

---

## ÉTAPE 2: Déployer le Frontend sur Vercel

### 2.1 Créer un compte Vercel

1. Aller sur [https://vercel.com](https://vercel.com)
2. Cliquer sur "Sign Up" et utiliser votre compte GitHub

### 2.2 Importer le projet

1. Dans le dashboard Vercel, cliquer sur "Add New..." → "Project"
2. Sélectionner votre dépôt GitHub `Fresha-Clone-Project`
3. Cliquer sur "Import"

### 2.3 Configuration du projet Frontend

**Paramètres à configurer:**

| Champ | Valeur |
|-------|--------|
| **Framework Preset** | Next.js (détection automatique) |
| **Root Directory** | `front_client/front_client_sb` |
| **Build Command** | `npm run build` |
| **Output Directory** | `.next` (automatique) |
| **Install Command** | `npm install` |

### 2.4 Variables d'environnement Frontend

Dans la section "Environment Variables", ajouter:

| Clé | Valeur |
|-----|--------|
| `NEXT_PUBLIC_API_URL` | `https://VOTRE_BACKEND.onrender.com/api` |
| `NEXT_PUBLIC_API_BASE_URL` | `https://VOTRE_BACKEND.onrender.com` |

**⚠️ Remplacer** `VOTRE_BACKEND.onrender.com` par l'URL réelle de votre backend Render (étape 1.6)

### 2.5 Déployer

1. Cliquer sur "Deploy"
2. Attendre 2-3 minutes
3. Votre site sera disponible à une URL type: `https://fresha-clone-xxxx.vercel.app`

---

## ÉTAPE 3: Configurer CORS sur le Backend

Le backend doit autoriser les requêtes depuis votre frontend Vercel.

### 3.1 Mettre à jour le fichier app.ts

Dans `backend_fresha/src/app.ts`, modifier la configuration CORS:

```typescript
app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://VOTRE_FRONTEND.vercel.app'  // ← Ajouter cette ligne
    ],
    credentials: true,
  })
);
```

### 3.2 Redéployer le backend

```bash
git add .
git commit -m "Update CORS for production"
git push origin main
```

Render redéploiera automatiquement votre backend.

---

## ÉTAPE 4: Tester l'application déployée

### 4.1 Vérifier le backend

Tester l'endpoint de santé:
```
https://VOTRE_BACKEND.onrender.com/health
```

Devrait retourner:
```json
{
  "status": "OK",
  "message": "Backend is running"
}
```

### 4.2 Vérifier le frontend

1. Ouvrir `https://VOTRE_FRONTEND.vercel.app`
2. Naviguer dans l'application
3. Tester le flux de réservation

### 4.3 Partager avec vos clients

Envoyer simplement l'URL Vercel à vos clients:
```
🎉 Application de test: https://VOTRE_FRONTEND.vercel.app
```

---

## Option 2: Déploiement avec Docker (Avancé)

Si vous préférez déployer sur votre propre serveur ou utiliser Railway/Fly.io:

### Backend

```bash
cd backend_fresha
docker build -t fresha-backend .
docker run -p 5000:5000 --env-file .env fresha-backend
```

### Frontend

```bash
cd front_client/front_client_sb
docker build -t fresha-frontend .
docker run -p 3000:3000 fresha-frontend
```

---

## Option 3: Autres plateformes

### Railway (Alternative à Render)

1. [https://railway.app](https://railway.app)
2. Similaire à Render, plus généreux sur le plan gratuit
3. Suivre les mêmes étapes que Render

### Heroku

1. [https://www.heroku.com](https://www.heroku.com)
2. Nécessite une carte bancaire même pour le plan gratuit
3. Plus complexe à configurer

---

## Résolution de problèmes

### Le backend ne démarre pas

- Vérifier que toutes les variables d'environnement sont définies
- Vérifier les logs dans Render Dashboard
- S'assurer que la commande de build inclut `npx prisma generate`

### Le frontend ne peut pas se connecter au backend

- Vérifier que `NEXT_PUBLIC_API_URL` pointe vers le bon backend
- Vérifier la configuration CORS dans `app.ts`
- Ouvrir la console du navigateur (F12) pour voir les erreurs

### Erreur de connexion à la base de données

- Vérifier que `DATABASE_URL` contient `?sslmode=require`
- Tester la connexion depuis Render en vérifiant les logs
- Vérifier que la base Neon Cloud est accessible

### Le backend Render est lent au premier chargement

- C'est normal sur le plan gratuit (service en veille)
- Considérer passer au plan payant ($7/mois) pour éviter la mise en veille
- Ou utiliser Railway qui a de meilleures performances gratuites

---

## Checklist finale avant de partager avec les clients

- [ ] Backend déployé et accessible
- [ ] Frontend déployé et accessible
- [ ] CORS configuré correctement
- [ ] Variables d'environnement définies
- [ ] Test de bout en bout réussi:
  - [ ] Page d'accueil se charge
  - [ ] Liste des salons s'affiche
  - [ ] Flux de réservation fonctionne
  - [ ] Pas d'erreurs dans la console du navigateur

---

## Coûts estimés

### Plan Gratuit (Recommandé pour tests)

| Service | Coût | Limitations |
|---------|------|------------|
| Render (Backend) | Gratuit | Service en veille après 15min, 750h/mois |
| Vercel (Frontend) | Gratuit | 100 GB bande passante, builds illimités |
| Neon (Database) | Gratuit | 0.5 GB stockage, 1 projet |
| **Total** | **0€/mois** | Parfait pour tests clients |

### Plan Production (Recommandé pour lancement)

| Service | Coût/mois |
|---------|-----------|
| Render Starter | 7$ |
| Vercel Pro | 20$ |
| Neon Pro | 19$ |
| **Total** | **~46$/mois** |

---

## Support et ressources

- **Documentation Render**: https://render.com/docs
- **Documentation Vercel**: https://vercel.com/docs
- **Documentation Next.js**: https://nextjs.org/docs
- **Documentation Prisma**: https://www.prisma.io/docs

---

## Mises à jour futures

Pour mettre à jour l'application après modification du code:

```bash
# Commit et push les changements
git add .
git commit -m "Description des changements"
git push origin main
```

**Les deux plateformes redéploieront automatiquement** votre application!

---

Bon déploiement ! 🚀
