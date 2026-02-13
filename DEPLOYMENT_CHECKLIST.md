# ✅ Checklist de Déploiement

## 📦 Fichiers créés pour le déploiement

- ✅ `backend_fresha/Dockerfile` - Configuration Docker backend
- ✅ `backend_fresha/.dockerignore` - Fichiers à exclure du build
- ✅ `backend_fresha/.env.example` - Template des variables d'environnement
- ✅ `front_client/front_client_sb/Dockerfile` - Configuration Docker frontend
- ✅ `front_client/front_client_sb/.dockerignore` - Fichiers à exclure du build
- ✅ `front_client/front_client_sb/.env.example` - Template des variables d'environnement
- ✅ `front_client/front_client_sb/next.config.ts` - Optimisé pour production
- ✅ `DEPLOYMENT.md` - Guide complet de déploiement
- ✅ `QUICK_START.md` - Guide rapide (30 min)

---

## 🎯 Prochaines étapes

### 1. Pousser le code sur GitHub

```bash
git add .
git commit -m "Add deployment configuration files"
git push origin main
```

**Si vous n'avez pas encore de dépôt GitHub:**

```bash
# 1. Créer un nouveau dépôt sur github.com (sans README)
# 2. Exécuter ces commandes dans le dossier du projet:

git remote add origin https://github.com/VOTRE_USERNAME/VOTRE_REPO.git
git branch -M main
git push -u origin main
```

---

### 2. Créer les comptes nécessaires

- [ ] Compte GitHub: [github.com/signup](https://github.com/signup)
- [ ] Compte Render: [render.com](https://render.com)
- [ ] Compte Vercel: [vercel.com](https://vercel.com)

---

### 3. Déployer le Backend (Render)

**URL de configuration:** [render.com/dashboard](https://dashboard.render.com)

#### Paramètres Render:

| Champ | Valeur |
|-------|--------|
| Name | `fresha-backend` |
| Root Directory | `backend_fresha` |
| Build Command | `npm install && npx prisma generate && npm run build` |
| Start Command | `npm start` |

#### Variables d'environnement à définir:

```bash
DATABASE_URL=postgresql://neondb_owner:npg_xP8cICgFeyH9@ep-rapid-mountain-abzgzzcw-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=[GENERER UN SECRET]
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=[GENERER UN AUTRE SECRET]
NODE_ENV=production
PORT=5000
```

**Générer des secrets sécurisés:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

#### Après le déploiement:
- [ ] Noter l'URL du backend: `https://__________________.onrender.com`
- [ ] Tester: `https://VOTRE_URL.onrender.com/health`

---

### 4. Déployer le Frontend (Vercel)

**URL de configuration:** [vercel.com/dashboard](https://vercel.com/dashboard)

#### Paramètres Vercel:

| Champ | Valeur |
|-------|--------|
| Framework Preset | Next.js |
| Root Directory | `front_client/front_client_sb` |
| Build Command | `npm run build` |
| Output Directory | `.next` |

#### Variables d'environnement à définir:

```bash
NEXT_PUBLIC_API_URL=https://VOTRE_BACKEND.onrender.com/api
NEXT_PUBLIC_API_BASE_URL=https://VOTRE_BACKEND.onrender.com
```

**⚠️ Remplacer `VOTRE_BACKEND.onrender.com` par l'URL réelle de l'étape 3**

#### Après le déploiement:
- [ ] Noter l'URL du frontend: `https://__________________.vercel.app`
- [ ] Tester l'accès: `https://VOTRE_URL.vercel.app`

---

### 5. Mettre à jour CORS

Modifier `backend_fresha/src/app.ts`:

```typescript
app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://VOTRE_APP.vercel.app'  // ← Ajouter votre URL Vercel ici
    ],
    credentials: true,
  })
);
```

Puis:
```bash
git add backend_fresha/src/app.ts
git commit -m "Update CORS for production"
git push origin main
```

Render redéploiera automatiquement (2-3 min).

---

### 6. Tests finaux

- [ ] Backend accessible: `https://VOTRE_BACKEND.onrender.com/health`
- [ ] Frontend accessible: `https://VOTRE_FRONTEND.vercel.app`
- [ ] Page d'accueil se charge correctement
- [ ] Pas d'erreurs dans la console du navigateur (F12)
- [ ] Navigation fonctionne
- [ ] Connexion au backend réussie

---

## 🚀 Partager avec les clients

Une fois tous les tests réussis, envoyez ce message:

```
Bonjour,

L'application Fresha Clone est maintenant déployée et prête pour vos tests !

🔗 Lien de l'application: https://VOTRE_APP.vercel.app

Fonctionnalités disponibles:
- Consultation des salons
- Navigation dans les services
- Flux de réservation

N'hésitez pas à me faire vos retours et remarques.

Bonne découverte !
```

---

## 📊 Informations importantes

### Limitations du plan gratuit:

**Render (Backend):**
- Le service se met en veille après 15 minutes d'inactivité
- Premier accès peut prendre 30-60 secondes
- 750 heures gratuites par mois

**Vercel (Frontend):**
- 100 GB de bande passante
- Builds illimités
- Performances excellentes

### Pour passer en production:

Si les clients veulent aller plus loin:
- Render Starter: 7$/mois (pas de veille)
- Vercel Pro: 20$/mois (analytiques avancées)
- Neon Pro: 19$/mois (plus de stockage)

---

## 🆘 En cas de problème

### Le backend ne démarre pas
- Vérifier les logs dans Render Dashboard
- Vérifier que toutes les variables d'environnement sont définies
- Vérifier que `npx prisma generate` est dans la commande de build

### Le frontend ne se connecte pas au backend
- Vérifier `NEXT_PUBLIC_API_URL` dans Vercel
- Vérifier la configuration CORS dans `app.ts`
- Ouvrir la console du navigateur (F12) pour voir les erreurs

### Erreur 503 ou timeout
- Normal sur Render gratuit au premier chargement
- Attendre 30-60 secondes et réessayer

---

## 📚 Documentation

- **Guide complet:** [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Guide rapide:** [QUICK_START.md](./QUICK_START.md)
- **Support Render:** https://render.com/docs
- **Support Vercel:** https://vercel.com/docs

---

**Date de préparation:** 2025-12-27
**Temps estimé:** 30 minutes
**Coût:** 0€ (plans gratuits)

Bon déploiement ! 🎉
